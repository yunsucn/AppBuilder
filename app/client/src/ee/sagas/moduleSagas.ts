import {
  takeLatest,
  all,
  call,
  put,
  select,
  takeEvery,
  fork,
  join,
} from "redux-saga/effects";

import ModuleApi from "@appsmith/api/ModuleApi";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import {
  getCurrentModuleId,
  getCurrentProcessingAddModuleReference,
  getCurrentProcessingRemoveModuleReference,
  getModuleById,
  getModulePublicAction,
} from "@appsmith/selectors/modulesSelector";
import type { ApiResponse } from "api/ApiResponses";
import type {
  AddModuleReferencesByNamePayload,
  FetchModuleActionsPayload,
} from "@appsmith/actions/moduleActions";
import {
  fetchAllModuleEntityCompletion,
  type CreateJSModulePayload,
  type CreateQueryModulePayload,
  type DeleteModulePayload,
  type SaveModuleNamePayload,
  type SetupModulePayload,
  type UpdateModuleInputsPayload,
} from "@appsmith/actions/moduleActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  CreateModulePayload,
  FetchModuleEntitiesResponse,
  RefactorModulePayload,
} from "@appsmith/api/ModuleApi";
import history from "utils/history";
import {
  currentPackageEditorURL,
  moduleEditorURL,
} from "@appsmith/RouteBuilder";
import {
  PluginPackageName,
  type Action,
  type CreateActionDefaultsParams,
  type CreateApiActionDefaultsParams,
} from "entities/Action";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import type { ModuleMetadata } from "@appsmith/constants/ModuleConstants";
import {
  MODULE_TYPE,
  type Module,
  MODULE_PREFIX,
  MODULE_ENTITY_TYPE,
  MODULE_EDITOR_TYPE,
} from "@appsmith/constants/ModuleConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { createNewModuleName } from "@appsmith/utils/Packages/moduleHelpers";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";
import { generateDefaultInputSection } from "@appsmith/components/InputsForm/Fields/helper";
import { executePageLoadActions } from "actions/pluginActionActions";
import { createDummyJSCollectionActions } from "utils/JSPaneUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { generateDefaultJSObject } from "sagas/JSPaneSagas";
import type {
  CreateJSCollectionRequest,
  RefactorAction,
  UpdateCollectionActionNameRequest,
} from "@appsmith/api/JSActionAPI";
import type { JSCollection } from "entities/JSCollection";
import JSActionAPI from "@appsmith/api/JSActionAPI";
import { resetDebuggerLogs } from "sagas/InitSagas";
import {
  UPDATE_MODULE_INPUT_ERROR,
  createMessage,
} from "@appsmith/constants/messages";
import analytics from "@appsmith/utils/Packages/analytics";
import {
  getModulesMetadata,
  getModulesMetadataById,
} from "@appsmith/selectors/packageSelectors";
import type { Diff, DiffEdit } from "deep-diff";
import { initialize } from "redux-form";
import {
  API_EDITOR_FORM_NAME,
  QUERY_EDITOR_FORM_NAME,
} from "@appsmith/constants/forms";
import { createModuleInstance } from "@appsmith/actions/moduleInstanceActions";
import { getAllModuleInstances } from "@appsmith/selectors/moduleInstanceSelectors";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import {
  createModuleInstanceSaga,
  setupModuleInstanceSaga,
} from "@appsmith/sagas/moduleInstanceSagas";
import type { UpdateModuleInstanceStaleStatusPayload } from "@appsmith/api/ModuleInstanceApi";
import type { Task } from "redux-saga";
import { getShowModuleReference } from "@appsmith/selectors/moduleFeatureSelectors";

function hasInputNameChanged(diff?: Diff<unknown, unknown>[]) {
  if (diff && diff[0].kind === "E") {
    const change = diff[0];
    const key = (change.path || [])?.slice(-1)[0] || "";

    return key === "label";
  }

  return false;
}

function inputNameDiff(diff: DiffEdit<string, string>) {
  return {
    oldName: diff.lhs,
    newName: diff.rhs,
  };
}

function findInputIdFor(inputsForm: Module["inputsForm"], name: string) {
  const input = inputsForm[0].children.find((inp) => inp.label === name);

  return input?.id;
}

function mapByName(modules: ModulesReducerState) {
  return Object.values(modules).reduce(
    (acc, module) => {
      acc[module.name] = module;
      return acc;
    },
    {} as Record<string, ModulesReducerState[string]>,
  );
}

function mapByModuleId(moduleInstances: Record<string, ModuleInstance>) {
  return Object.values(moduleInstances).reduce(
    (acc, moduleInstance) => {
      acc[moduleInstance.sourceModuleId] = moduleInstance;
      return acc;
    },
    {} as Record<string, ModuleInstance>,
  );
}

export function* addModuleReferencesByNameSaga(
  action: ReduxAction<AddModuleReferencesByNamePayload>,
) {
  try {
    const { names } = action.payload;
    const modules: ModulesReducerState = yield select(getAllModules);
    const moduleByName = mapByName(modules);
    const tasks = [];
    const currentModuleId: string = yield select(getCurrentModuleId);
    const moduleInstances: Record<string, ModuleInstance> = yield select(
      getAllModuleInstances,
    );
    const moduleInstanceByModuleId = mapByModuleId(moduleInstances);
    const prevProcessingAddModuleReference: Set<string> = yield select(
      getCurrentProcessingAddModuleReference,
    );
    const updatedInstanceStaleStatus: UpdateModuleInstanceStaleStatusPayload =
      [];
    const processedNames = new Set<string>();

    // Set the names that are currently being processed i.e the payload
    yield put({
      type: ReduxActionTypes.SET_CURR_PROCESSING_ADD_MODULE_REFERENCE,
      payload: {
        names,
      },
    });

    for (const name of names) {
      const module = moduleByName[name];
      const moduleInstance = moduleInstanceByModuleId[module.id];

      if (prevProcessingAddModuleReference.has(name)) {
        continue;
      }

      /**
       * Checks if a module instance is already present for a module
       * then we shouldn't attempt to create another instance of it
       * since under the rule of module reference, only one instance of
       * referenced can exist for the current module.
       */
      if (moduleInstance && !moduleInstance.isDummy) {
        if (moduleInstance?.isStale) {
          updatedInstanceStaleStatus.push({
            moduleInstanceId: moduleInstance.id,
            isStale: false,
          });
        }
        processedNames.add(name);
        continue;
      }

      processedNames.add(name);
      const task: Task = yield fork(
        createModuleInstanceSaga,
        createModuleInstance({
          contextId: currentModuleId,
          contextType: ModuleInstanceCreatorType.MODULE,
          sourceModuleId: module.id,
          shouldRedirect: false,
          overrideName: module.name,
        }),
      );

      tasks.push(task);
    }

    // TODO (Ashit): Uncomment this code when the stale API is available in backend
    // if (updatedInstanceStaleStatus.length > 0) {
    //   const updateTask: Task = yield fork(
    //     ModuleInstanceApi.updateModuleInstanceStaleStatus,
    //     updatedInstanceStaleStatus,
    //   );

    //   const response: ApiResponse = yield join(updateTask);
    //   yield validateResponse(response);
    // }

    // Wait for all tasks to complete
    yield tasks.map((task) => join(task));

    yield put({
      type: ReduxActionTypes.ADD_MODULE_REFERENCE_BY_NAME_SUCCESS,
      payload: {
        names: [...processedNames],
        updatedInstanceStaleStatus,
      },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_MODULE_REFERENCE_BY_NAME_ERROR,
      payload: action.payload,
    });
  }
}

/**
 * Saga function that handles marking module instances as stale based on provided module names.
 * @param action - Redux action containing payload with names of modules to mark as stale
 */
export function* removeModuleReferencesByNameSaga(
  action: ReduxAction<AddModuleReferencesByNamePayload>,
) {
  try {
    const { names } = action.payload;
    const modules: ModulesReducerState = yield select(getAllModules);
    const moduleByName = mapByName(modules);
    const moduleInstances: Record<string, ModuleInstance> = yield select(
      getAllModuleInstances,
    );
    const moduleInstanceByModuleId = mapByModuleId(moduleInstances);
    const updatedInstanceStaleStatus: UpdateModuleInstanceStaleStatusPayload =
      [];
    const prevProcessingRemoveModuleReference: Set<string> = yield select(
      getCurrentProcessingRemoveModuleReference,
    );

    const processedNames = [];

    // Set the names that are currently being processed i.e the payload
    yield put({
      type: ReduxActionTypes.SET_CURR_PROCESSING_REMOVE_MODULE_REFERENCE,
      payload: {
        names,
      },
    });

    for (const name of names) {
      const module = moduleByName[name];
      const moduleInstance = moduleInstanceByModuleId[module.id];
      /**
       * Check the criteria to skip a module instance to be marked as stale
       * 1. If a module instance does not exist
       * 2. If a module instance is already stale
       * 3. If in a previous request the marking of stale is already in progress
       */
      if (prevProcessingRemoveModuleReference.has(name)) {
        continue;
      }

      processedNames.push(name);

      if (
        !moduleInstance ||
        (moduleInstance?.isStale && !moduleInstance?.isDummy)
      ) {
        continue;
      }

      updatedInstanceStaleStatus.push({
        moduleInstanceId: moduleInstance.id,
        isStale: true,
      });
    }

    // TODO (Ashit): Uncomment this code when the stale API is available in backend
    // if (updatedInstanceStaleStatus.length > 0) {
    //   const response: ApiResponse = yield call(
    //     ModuleInstanceApi.updateModuleInstanceStaleStatus,
    //     updatedInstanceStaleStatus,
    //   );
    //   yield validateResponse(response);
    // }

    yield put({
      type: ReduxActionTypes.REMOVE_MODULE_REFERENCE_BY_NAME_SUCCESS,
      payload: {
        names: processedNames,
        updatedInstanceStaleStatus,
      },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.REMOVE_MODULE_REFERENCE_BY_NAME_ERROR,
      payload: action.payload,
    });
  }
}

export function* deleteModuleSaga(action: ReduxAction<DeleteModulePayload>) {
  try {
    const response: ApiResponse = yield call(
      ModuleApi.deleteModule,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_MODULE_SUCCESS,
        payload: action.payload,
      });
      analytics.deleteModule(action.payload.id);

      if (!!action.payload.onSuccess) {
        action.payload.onSuccess();
      } else {
        history.push(currentPackageEditorURL());
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_MODULE_ERROR,
      payload: { error },
    });
  }
}

export function* saveModuleNameSaga(
  action: ReduxAction<SaveModuleNamePayload>,
) {
  try {
    const { id, name } = action.payload;
    const module: ReturnType<typeof getModuleById> = yield select(
      getModuleById,
      id,
    );
    const currentModuleId: string = yield select(getCurrentModuleId);
    const metadata: ModuleMetadata = yield select(getModulesMetadataById, id);

    if (!module) {
      throw Error("Saving module name failed. Module not found.");
    }

    const refactorPayload: RefactorModulePayload = {
      moduleId: id,
      oldName: module.name,
      newName: name,
    };

    const response: ApiResponse<Module> = yield call(
      ModuleApi.refactorModule,
      refactorPayload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS,
        payload: {
          ...response.data,
          ...metadata,
        },
      });

      // When different module name is modified using the entity explorer
      // calling fetchModuleEntitiesSaga will override current modules's entities in reducer
      if (currentModuleId === id) {
        yield call(fetchModuleEntitiesSaga, {
          payload: { moduleId: id },
          type: ReduxActionTypes.FETCH_MODULE_ENTITIES_INIT,
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_MODULE_NAME_ERROR,
      payload: { error },
    });
  }
}

export function* updateModuleInputsSaga(
  action: ReduxAction<UpdateModuleInputsPayload>,
) {
  try {
    const { diff, id, inputsForm, moduleEditorType } = action.payload;
    const module: ReturnType<typeof getModuleById> = yield select(
      getModuleById,
      id,
    );
    const metadata: ModuleMetadata = yield select(getModulesMetadataById, id);

    if (!module) {
      throw Error("Saving module inputs failed. Module not found.");
    }

    let response: ApiResponse<Module>;

    if (diff && hasInputNameChanged(diff)) {
      const changes = inputNameDiff(diff[0] as DiffEdit<string, string>);
      const inputId = findInputIdFor(inputsForm, changes.newName);

      if (!inputId) {
        throw new Error("Could not find input to update name");
      }

      const payload = {
        moduleId: id,
        inputId,
        ...changes,
      };

      response = yield call(ModuleApi.refactorModuleInput, payload);
    } else {
      const payload = {
        ...module,
        inputsForm,
      };

      response = yield call(ModuleApi.updateModule, payload);
    }

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS,
        payload: {
          ...response.data,
          ...metadata,
        },
      });

      analytics.updateModule(response.data);

      if (hasInputNameChanged(diff)) {
        yield call(fetchModuleEntitiesSaga, {
          type: ReduxActionTypes.FETCH_MODULE_ENTITIES_INIT,
          payload: { moduleId: id },
        });

        const publicAction: Action = yield select(getModulePublicAction, id);

        if (moduleEditorType === MODULE_EDITOR_TYPE.QUERY) {
          yield put(initialize(QUERY_EDITOR_FORM_NAME, publicAction));
        }

        if (moduleEditorType === MODULE_EDITOR_TYPE.API) {
          yield put(initialize(API_EDITOR_FORM_NAME, publicAction));
        }

        /** This is a dummy action to trigger evaluation for the
         * entities fetched after refactoring.
         */
        yield put({
          type: ReduxActionTypes.REFACTOR_MODULE_INPUT_SUCCESS,
          payload: undefined,
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INPUTS_ERROR,
      payload: {
        error: { message: createMessage(UPDATE_MODULE_INPUT_ERROR) },
      },
    });
  }
}

export function* fetchModuleEntitiesSaga(
  action: ReduxAction<FetchModuleActionsPayload>,
) {
  try {
    const response: ApiResponse<FetchModuleEntitiesResponse> = yield call(
      ModuleApi.getModuleEntities,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_ENTITIES_ERROR,
      payload: { error },
    });
  }
}

/**
 * Creates an action with specific datasource created by a user
 * @param action
 */
export function* createQueryModuleSaga(
  action: ReduxAction<CreateQueryModulePayload>,
) {
  try {
    const {
      apiType = PluginPackageName.REST_API,
      datasourceId,
      from,
      packageId,
    } = action.payload;
    const allModules: ModulesReducerState = yield select(getAllModules);
    const moduleMetadata: Record<string, ModuleMetadata> =
      yield select(getModulesMetadata);
    const newActionName = createNewModuleName(allModules, MODULE_PREFIX.QUERY);

    const defaultAction: Partial<Action> = datasourceId
      ? yield call(createDefaultActionPayloadWithPluginDefaults, {
          datasourceId,
          from,
          newActionName,
        } as CreateActionDefaultsParams)
      : yield call(createDefaultApiActionPayload, {
          apiType,
          from,
          newActionName,
        } as CreateApiActionDefaultsParams);

    const { name, ...restAction } = defaultAction;
    const payload: CreateModulePayload = {
      packageId,
      name,
      type: MODULE_TYPE.QUERY,
      inputsForm: [generateDefaultInputSection()],
      entity: {
        type: MODULE_ENTITY_TYPE.ACTION,
        ...restAction,
      },
    };

    const response: ApiResponse<Module> = yield call(
      ModuleApi.createModule,
      payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS,
        payload: {
          ...response.data,
          ...moduleMetadata[response.data.id],
        },
      });

      analytics.createModule(response.data);

      history.push(moduleEditorURL({ moduleId: response.data.id }));
      yield fork(resetDebuggerLogs);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_QUERY_MODULE_ERROR,
      payload: { error },
    });
  }
}

export function* createJSModuleSaga(
  action: ReduxAction<CreateJSModulePayload>,
) {
  try {
    const { packageId } = action.payload;
    const allModules: ModulesReducerState = yield select(getAllModules);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const moduleMetadata: Record<string, ModuleMetadata> =
      yield select(getModulesMetadata);
    const { actions, body, variables } = createDummyJSCollectionActions(
      workspaceId,
      {
        packageId,
      },
    );
    const newModuleName = createNewModuleName(allModules, MODULE_PREFIX.JS);

    const defaultJSObject: CreateJSCollectionRequest =
      yield generateDefaultJSObject({
        name: newModuleName,
        workspaceId,
        actions,
        body,
        variables,
      });

    const payload: CreateModulePayload = {
      packageId,
      name: newModuleName,
      type: MODULE_TYPE.JS,
      entity: {
        type: MODULE_ENTITY_TYPE.JS_OBJECT,
        ...defaultJSObject,
      },
    };

    const response: ApiResponse<Module> = yield call(
      ModuleApi.createModule,
      payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_JS_MODULE_SUCCESS,
        payload: {
          ...response.data,
          ...moduleMetadata[response.data.id],
        },
      });

      analytics.createModule(response.data);

      history.push(moduleEditorURL({ moduleId: response.data.id }));
      yield fork(resetDebuggerLogs);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_JS_MODULE_ERROR,
      payload: { error },
    });
  }
}

export function* setupModuleSaga(action: ReduxAction<SetupModulePayload>) {
  try {
    const { moduleId } = action.payload;
    const tasks: Task[] = [];
    const showModuleReference: boolean = yield select(getShowModuleReference);

    yield put({
      type: ReduxActionTypes.SET_CURRENT_MODULE,
      payload: { id: moduleId },
    });

    tasks[0] = yield fork(fetchModuleEntitiesSaga, {
      payload: { moduleId: moduleId },
      type: ReduxActionTypes.FETCH_MODULE_ENTITIES_INIT,
    });

    // Remove false one fetch module instance and fetch module instance entities for modules are up
    if (showModuleReference && false) {
      tasks[1] = yield fork(setupModuleInstanceSaga, {
        type: ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
        payload: {
          contextId: moduleId,
          contextType: ModuleInstanceCreatorType.MODULE,
          viewMode: false,
        },
      });
    }

    yield all(tasks.map((task) => join(task)));

    // To start eval for new module
    yield put(fetchAllModuleEntityCompletion([executePageLoadActions()]));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_MODULE_ERROR,
      payload: { error },
    });
  }
}

export function* handleRefactorJSActionNameSaga(
  data: ReduxAction<{
    refactorAction: RefactorAction;
    actionCollection: JSCollection;
  }>,
) {
  const { refactorAction } = data.payload;

  if (refactorAction.moduleId) {
    const requestData: UpdateCollectionActionNameRequest = {
      ...data.payload.refactorAction,
      actionCollection: data.payload.actionCollection,
      contextType: "MODULE",
    };
    // call to refactor action
    try {
      const refactorResponse: ApiResponse =
        yield JSActionAPI.updateJSCollectionActionRefactor(requestData);

      const isRefactorSuccessful: boolean =
        yield validateResponse(refactorResponse);

      if (isRefactorSuccessful) {
        yield call(fetchModuleEntitiesSaga, {
          payload: { moduleId: refactorAction.moduleId },
          type: ReduxActionTypes.FETCH_MODULE_ENTITIES_INIT,
        });

        yield put({
          type: ReduxActionTypes.REFACTOR_JS_ACTION_NAME_SUCCESS,
          payload: { collectionId: data.payload.actionCollection.id },
        });
      }
    } catch (error) {
      yield put({
        type: ReduxActionErrorTypes.REFACTOR_JS_ACTION_NAME_ERROR,
        payload: { collectionId: data.payload.actionCollection.id },
      });
    }
  }
}

export default function* modulesSaga() {
  yield all([
    takeEvery(
      ReduxActionTypes.ADD_MODULE_REFERENCE_BY_NAME_INIT,
      addModuleReferencesByNameSaga,
    ),
    takeEvery(
      ReduxActionTypes.REMOVE_MODULE_REFERENCE_BY_NAME_INIT,
      removeModuleReferencesByNameSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_MODULE_INIT, deleteModuleSaga),
    takeLatest(ReduxActionTypes.SAVE_MODULE_NAME_INIT, saveModuleNameSaga),
    takeLatest(
      ReduxActionTypes.CREATE_QUERY_MODULE_INIT,
      createQueryModuleSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_MODULE_ENTITIES_INIT,
      fetchModuleEntitiesSaga,
    ),
    takeLatest(ReduxActionTypes.CREATE_JS_MODULE_INIT, createJSModuleSaga),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INPUTS_INIT,
      updateModuleInputsSaga,
    ),
    takeLatest(ReduxActionTypes.SETUP_MODULE_INIT, setupModuleSaga),
    takeEvery(
      ReduxActionTypes.REFACTOR_JS_ACTION_NAME,
      handleRefactorJSActionNameSaga,
    ),
  ]);
}
