import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import type {
  ConvertEntityToInstanceActionPayload,
  CopyMoveModuleInstancePayload,
  CreateModuleInstancePayload,
  DeleteModuleInstancePayload,
  FetchModuleInstancesPayload,
  RunQueryModuleInstancePayload,
  SaveModuleInstanceNamePayload,
  SetupModuleInstancePayload,
  UpdateModuleInstanceOnPageLoadSettingsPayload,
  UpdateModuleInstancePayload,
  UpdateModuleInstanceSettingsPayload,
} from "@appsmith/actions/moduleInstanceActions";
import {
  fetchModuleInstanceEntities,
  fetchModuleInstances,
  runQueryModuleInstance,
} from "@appsmith/actions/moduleInstanceActions";
import type {
  ConvertEntityToInstancePayload,
  ConvertEntityToInstanceResponse,
} from "@appsmith/api/ModuleInstanceApi";
import ModuleInstanceApi from "@appsmith/api/ModuleInstanceApi";
import ModuleInstancesApi, {
  type CreateModuleInstanceResponse,
  type FetchModuleInstanceEntitiesResponse,
} from "@appsmith/api/ModuleInstanceApi";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getAllModuleInstances,
  getModuleInstanceActiveJSActionId,
  getModuleInstanceById,
  getModuleInstancePublicAction,
  getModuleInstancePublicEntity,
} from "@appsmith/selectors/moduleInstanceSelectors";
import ActionAPI from "api/ActionAPI";
import type { ApiResponse } from "api/ApiResponses";
import { PluginType, type Action } from "entities/Action";
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import { runActionSaga } from "sagas/ActionExecution/PluginActionSaga";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";
import { shouldBeDefined } from "utils/helpers";
import type { AppState } from "@appsmith/reducers";
import {
  getActionById,
  getCurrentLayoutId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { toast } from "design-system";
import {
  createMessage,
  MODULE_INSTANCE_COPY_ERROR,
  MODULE_INSTANCE_COPY_SUCCESS,
  MODULE_INSTANCE_MOVE_ERROR,
  MODULE_INSTANCE_MOVE_SUCCESS,
  MODULE_INSTANCE_RENAME_ERROR,
  MODULE_SETUP_FAILURE,
} from "@appsmith/constants/messages";
import * as log from "loglevel";
import { updateCanvasWithDSL } from "@appsmith/sagas/PageSagas";
import type { JSCollection } from "entities/JSCollection";
import type { JSCollectionCreateUpdateResponse } from "@appsmith/api/JSActionAPI";
import {
  closeQueryActionTabSuccess,
  updateActionData,
} from "actions/pluginActionActions";
import { fetchPackagesForWorkspaceSaga } from "./packagesSagas";
import {
  getModulesMetadata,
  getPackagesList,
} from "@appsmith/selectors/packageSelectors";
import type { PackageMetadata } from "@appsmith/constants/PackageConstants";
import type {
  ModuleInput,
  ModuleMetadata,
} from "@appsmith/constants/ModuleConstants";
import { type Module, MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import {
  getAllModules,
  getCurrentModuleId,
  getModuleById,
} from "@appsmith/selectors/modulesSelector";
import {
  getNewEntityName,
  getPageNameByPageId,
} from "@appsmith/selectors/entitiesSelector";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import analytics from "@appsmith/utils/Packages/analytics";
import {
  handleJSEntityRedirect,
  handleQueryEntityRedirect,
} from "sagas/IDESaga";
import FocusRetention from "sagas/FocusRetentionSaga";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/appRoutes";
import { matchPath } from "react-router";
import { matchBasePath } from "@appsmith/pages/Editor/Explorer/helpers";
import { startExecutingJSFunction } from "actions/jsPaneActions";
import { getActionFromJsCollection } from "pages/Editor/JSEditor/utils";
import { closeJsActionTabSuccess } from "actions/jsActionActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import { difference } from "lodash";
import { generateReactKey } from "utils/generators";
import { getShowModuleReference } from "@appsmith/selectors/moduleFeatureSelectors";
import { failFastApiCalls } from "sagas/InitSagas";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";
import { updateJSCollectionAPICall } from "@appsmith/sagas/ApiCallerSagas";

export interface RefactorModuleInstanceNameProps {
  id: string;
  pageId: string;
  oldName: string;
  newName: string;
  type: MODULE_TYPE | undefined;
}

interface ModuleInstanceRouteParams {
  moduleInstanceId: string;
}

export function* createModuleInstanceSaga(
  action: ReduxAction<CreateModuleInstancePayload>,
) {
  const {
    contextId,
    contextType,
    overrideName,
    shouldRedirect = true,
    sourceModuleId,
  } = action.payload;
  const module: Module = yield select(getModuleById, sourceModuleId);
  try {
    const name: string = yield select(getNewEntityName, {
      prefix: `${module.name}`,
      parentEntityId: contextId,
      parentEntityKey: CreateNewActionKey.PAGE,
    });

    const response: ApiResponse<CreateModuleInstanceResponse> = yield call(
      ModuleInstancesApi.createModuleInstance,
      {
        sourceModuleId,
        contextId,
        contextType,
        name: overrideName || name,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS,
        payload: response.data,
      });

      analytics.createModuleInstance(response.data.moduleInstance);

      if (shouldRedirect) {
        const redirectURL = moduleInstanceEditorURL({
          pageId: contextId,
          moduleInstanceId: response.data.moduleInstance.id,
          moduleType: response.data.moduleInstance.type,
        });

        redirectURL && history.push(redirectURL);
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_MODULE_INSTANCE_ERROR,
      payload: error,
    });
  }
}

export function* generateDummyEntitiesForModuleInstances(
  dummyModulesInstances: ModuleInstance[],
) {
  const modulesMetadata: Record<string, ModuleMetadata> =
    yield select(getModulesMetadata);

  const dummyEntities: FetchModuleEntitiesResponse = {
    actions: [],
    jsCollections: [],
  };

  dummyModulesInstances.forEach(({ id, name, sourceModuleId }) => {
    if (sourceModuleId) {
      const { pluginType, publicEntity } = modulesMetadata[sourceModuleId];
      const entity = {
        ...publicEntity,
        isDummy: true,
        moduleInstanceId: id,
        isPublic: true,
        name: `${name}_${publicEntity.name}`,
      };
      if (pluginType === PluginType.JS) {
        dummyEntities.jsCollections.push(entity as JSCollection);
      } else {
        dummyEntities.actions.push(entity as Action);
      }
    }
  });

  return dummyEntities;
}

export function* generateDummyModuleInstancesForUnusedModules(
  currentModuleInstances: ModuleInstance[],
) {
  const modules: ModulesReducerState = yield select(getAllModules);
  const currentModuleId: string = yield select(getCurrentModuleId);
  const currentModuleIds = Object.keys(modules);

  const moduleIds = currentModuleInstances.map(
    ({ sourceModuleId }) => sourceModuleId,
  );
  // Avoid creating for self
  moduleIds.push(currentModuleId);

  const modulesWithoutInstances = difference(currentModuleIds, moduleIds);

  return modulesWithoutInstances.map((moduleId) => {
    const module = modules[moduleId];

    if (!module) return null;

    const inputs =
      module?.inputsForm?.[0]?.children?.reduce(
        (acc, inputSection) => {
          acc[inputSection.label] = inputSection.defaultValue;

          return acc;
        },
        {} as Record<string, string>,
      ) || {};

    const moduleInputs = module?.inputsForm?.reduce(
      (acc, section) => {
        section.children.forEach((input) => {
          acc[input.id] = input;
        });

        return acc;
      },
      {} as Record<string, ModuleInput>,
    );

    const dummyModuleInstance: ModuleInstance = {
      name: module.name,
      userPermissions: [
        "manage:moduleInstances",
        "delete:moduleInstances",
        "read:moduleInstances",
        "execute:moduleInstances",
      ],
      sourceModuleId: moduleId,
      contextId: currentModuleId,
      contextType: ModuleInstanceCreatorType.MODULE,
      jsonPathKeys: [],
      invalids: [],
      isValid: true,
      id: generateReactKey(),
      type: module.type,
      inputs,
      isStale: false,
      isDummy: true,
      moduleInputs,
    };

    return dummyModuleInstance;
  });
}

function* fetchModuleInstancesSaga(
  action: ReduxAction<FetchModuleInstancesPayload>,
) {
  try {
    const { contextId, contextType, viewMode } = action.payload;
    const showModuleReference: boolean = yield select(getShowModuleReference);

    const response: ApiResponse<ModuleInstance[]> = yield call(
      ModuleInstancesApi.fetchModuleInstances,
      {
        contextId,
        contextType,
        viewMode,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const result = [...response.data];

      if (showModuleReference) {
        const dummyModuleInstances: ModuleInstance[] = yield call(
          generateDummyModuleInstancesForUnusedModules,
          response.data,
        );

        result.concat(dummyModuleInstances);
      }

      yield put({
        type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS,
        payload: result,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_ERROR,
      error,
    });
  }
}

function* updateModuleInstanceSaga(
  action: ReduxAction<UpdateModuleInstancePayload>,
) {
  try {
    const moduleInstance: ReturnType<typeof getModuleInstanceById> =
      yield select(getModuleInstanceById, action.payload.id);

    if (!moduleInstance) {
      throw Error(
        "Saving module instance inputs failed. Module instance not found.",
      );
    }

    const payload: ModuleInstance = {
      ...moduleInstance,
      ...action.payload.moduleInstance,
    };

    const response: ApiResponse<ModuleInstance> = yield call(
      ModuleInstanceApi.updateModuleInstance,
      payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS,
        payload: response.data,
      });

      analytics.updateModuleInstance(response.data);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ERROR,
      payload: { error },
    });
  }
}

function* fetchModuleInstanceEntitiesSaga(
  action: ReduxAction<FetchModuleInstancesPayload>,
) {
  try {
    const { contextId, contextType, viewMode } = action.payload;

    const response: ApiResponse<FetchModuleInstanceEntitiesResponse> =
      yield call(ModuleInstancesApi.fetchModuleInstanceEntities, {
        contextId,
        contextType,
        viewMode,
      });
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_ENTITIES_ERROR,
      error,
    });
  }
}

export function* generateDummyInstanceAndEntitiesForUnusedModules() {
  try {
    const moduleInstances: Record<string, ModuleInstance> = yield select(
      getAllModuleInstances,
    );

    const dummyModuleInstances: ModuleInstance[] = yield call(
      generateDummyModuleInstancesForUnusedModules,
      Object.values(moduleInstances),
    );

    const dummyModuleInstanceEntities: FetchModuleEntitiesResponse = yield call(
      generateDummyEntitiesForModuleInstances,
      dummyModuleInstances,
    );

    yield put({
      type: ReduxActionTypes.GENERATE_DUMMY_MODULE_INSTANCES_SUCCESS,
      payload: {
        dummyModuleInstances,
        dummyModuleInstanceEntities,
      },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GENERATE_DUMMY_MODULE_INSTANCES_ERROR,
      payload: error,
    });
  }
}

export function* setupModuleInstanceSaga(
  action: ReduxAction<SetupModuleInstancePayload>,
) {
  try {
    const { contextId, contextType, viewMode } = action.payload;
    const packagesList: PackageMetadata[] = yield select(getPackagesList);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const isPackageEditor = window.location.pathname.startsWith("/pkg");
    const showModuleReference: boolean = yield select(getShowModuleReference);

    const instanceFetchSuccess: boolean = yield failFastApiCalls(
      [
        fetchModuleInstances({ contextId, contextType, viewMode }),
        fetchModuleInstanceEntities({ contextId, contextType, viewMode }),
      ],
      [
        ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS,
        ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS,
      ],
      [
        ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_ERROR,
        ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_ENTITIES_ERROR,
      ],
    );

    if (!instanceFetchSuccess) {
      throw new Error();
    }

    if (!packagesList.length) {
      yield fork(fetchPackagesForWorkspaceSaga, {
        type: ReduxActionTypes.FETCH_PACKAGES_FOR_WORKSPACE_INIT,
        payload: { workspaceId },
      });
    }

    if (isPackageEditor && showModuleReference) {
      yield put({
        type: ReduxActionTypes.GENERATE_DUMMY_MODULE_INSTANCES_INIT,
      });

      //  Wait for the dummy entities to be generated
      yield take([
        ReduxActionTypes.GENERATE_DUMMY_MODULE_INSTANCES_SUCCESS,
        ReduxActionErrorTypes.GENERATE_DUMMY_MODULE_INSTANCES_ERROR,
      ]);
    }

    yield put({
      type: ReduxActionTypes.SETUP_MODULE_INSTANCE_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_MODULE_INSTANCE_ERROR,
      payload: { error: { message: createMessage(MODULE_SETUP_FAILURE) } },
    });
  }
}

export function* setupModuleInstanceForViewSaga(
  action: ReduxAction<SetupModuleInstancePayload>,
) {
  try {
    const { contextId, contextType, viewMode } = action.payload;

    const instanceFetchSuccess: boolean = yield failFastApiCalls(
      [
        fetchModuleInstances({ contextId, contextType, viewMode }),
        fetchModuleInstanceEntities({ contextId, contextType, viewMode }),
      ],
      [
        ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS,
        ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS,
      ],
      [
        ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_ERROR,
        ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_ENTITIES_ERROR,
      ],
    );

    if (!instanceFetchSuccess) {
      throw new Error();
    }

    yield put({
      type: ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_ERROR,
      payload: { error: { message: createMessage(MODULE_SETUP_FAILURE) } },
    });
  }
}

function* updateModuleInstanceOnPageLoadSettingsSaga(
  action: ReduxAction<UpdateModuleInstanceOnPageLoadSettingsPayload>,
) {
  try {
    const { actionId, value } = action.payload;
    const response: ApiResponse = yield call(
      ActionAPI.toggleActionExecuteOnLoad,
      actionId,
      value || false,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_ERROR,
      payload: { error, id: action.payload.actionId },
    });
  }
}

function* updateModuleInstanceSettingsSaga(
  action: ReduxAction<UpdateModuleInstanceSettingsPayload>,
) {
  try {
    const isJSCollection = Boolean("actions" in action.payload);
    let response:
      | ApiResponse<JSCollectionCreateUpdateResponse>
      | ApiResponse<Action>
      | undefined;

    if (isJSCollection) {
      response = yield call(
        updateJSCollectionAPICall,
        action.payload as JSCollection,
      );
    } else {
      response = yield call(ActionAPI.updateAction, action.payload as Action);
    }

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS,
        payload: response?.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_SETTINGS_ERROR,
      payload: { error, id: action.payload.id },
    });
  }
}

function* runQueryModuleInstanceSaga(
  reduxAction: ReduxAction<RunQueryModuleInstancePayload>,
) {
  try {
    const { id } = reduxAction.payload;
    const action: Action | undefined = yield select(
      getModuleInstancePublicAction,
      id,
    );

    if (!action) throw new Error("Public action of module instance not found");

    yield call(runActionSaga, {
      payload: {
        id: action.id,
        action,
        skipOpeningDebugger: false,
        paginationField: undefined,
      },
      type: ReduxActionTypes.RUN_ACTION_REQUEST,
    });

    yield put({
      type: ReduxActionTypes.RUN_QUERY_MODULE_INSTANCE_SUCCESS,
      payload: {
        id,
      },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.RUN_QUERY_MODULE_INSTANCE_ERROR,
      payload: { error, id: reduxAction.payload.id },
    });
  }
}

function* deleteModuleInstanceSaga(
  action: ReduxAction<DeleteModuleInstancePayload>,
) {
  try {
    const response: ApiResponse = yield call(
      ModuleInstanceApi.deleteModuleInstance,
      action.payload,
    );
    const currentPageId: string = yield select(getCurrentPageId);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      analytics.deleteModuleInstance(action.payload.id);

      const currentUrl = window.location.pathname;
      yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);
      if (action.payload.type === MODULE_TYPE.JS) {
        yield call(handleJSEntityRedirect, action.payload.id);
        yield put(
          closeJsActionTabSuccess({
            id: action.payload.id,
            parentId: currentPageId,
          }),
        );
      } else if (action.payload.type === MODULE_TYPE.QUERY) {
        yield call(handleQueryEntityRedirect, action.payload.id);
        yield put(
          closeQueryActionTabSuccess({
            id: action.payload.id,
            parentId: currentPageId,
          }),
        );
      }
      yield put({
        type: ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS,
        payload: action.payload,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_MODULE_INSTANCE_ERROR,
      payload: { error, id: action.payload.id },
    });
  }
}

export function* refactorModuleInstanceName({
  id,
  newName,
  oldName,
  pageId,
  type,
}: RefactorModuleInstanceNameProps) {
  const layoutId: string = yield select(getCurrentLayoutId);
  // call to refactor module instance
  const oldPublicQuery: Action | JSCollection | undefined = yield select(
    getModuleInstancePublicEntity,
    id,
    type,
  );

  const refactorResponse: ApiResponse =
    yield ModuleInstanceApi.refactorModuleInstance({
      layoutId,
      moduleInstanceId: id,
      pageId: pageId,
      oldName: oldName,
      newName: newName,
    });
  const isRefactorSuccessful: boolean =
    yield validateResponse(refactorResponse);

  const currentPageId: string = yield select(getCurrentPageId);

  if (isRefactorSuccessful) {
    yield put({
      type: ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS,
      payload: {
        id,
        newName,
      },
    });
    if (currentPageId === pageId) {
      // @ts-expect-error: refactorResponse is of type unknown
      yield updateCanvasWithDSL(refactorResponse.data, pageId, layoutId);
    }
    yield call(setupModuleInstanceSaga, {
      type: ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
      payload: {
        contextId: pageId,
        contextType: ModuleInstanceCreatorType.PAGE,
        viewMode: false,
      },
    });
    if (currentPageId === pageId) {
      const publicQuery: Action | JSCollection | undefined = yield select(
        getModuleInstancePublicEntity,
        id,
        type,
      );
      if (type === MODULE_TYPE.QUERY) {
        yield put(
          updateActionData([
            {
              entityName: `${publicQuery?.name}`,
              dataPath: "data",
              data: undefined,
              dataPathRef: `${oldPublicQuery?.name}.data`,
            },
          ]),
        );
      } else if (type === MODULE_TYPE.JS) {
        const publicObject = publicQuery as JSCollection;
        const functions = publicObject && publicObject.actions;
        yield put(
          updateActionData(
            functions.map((f) => ({
              entityName: `${publicQuery?.name}`,
              data: undefined,
              dataPath: `${f.name}.data`,
              dataPathRef: `${oldPublicQuery?.name}.${f.name}.data`,
            })),
          ),
        );
      }
    }
  }
}

function* saveModuleInstanceNameSaga(
  action: ReduxAction<SaveModuleInstanceNamePayload>,
) {
  const moduleInstanceId = action.payload.id;
  const moduleInstance = shouldBeDefined<ModuleInstance | undefined>(
    yield select((state: AppState) =>
      getModuleInstanceById(state, moduleInstanceId),
    ),
    `Module Instance not found for moduleInstanceId - ${moduleInstanceId}`,
  );
  try {
    yield refactorModuleInstanceName({
      id: moduleInstanceId || "",
      pageId: moduleInstance?.contextId || "",
      oldName: moduleInstance?.name || "",
      newName: action.payload.name,
      type: moduleInstance?.type || undefined,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_MODULE_INSTANCE_NAME_ERROR,
      payload: {
        id: action.payload.id,
      },
    });
    toast.show(
      createMessage(MODULE_INSTANCE_RENAME_ERROR, action.payload.name),
      {
        kind: "error",
      },
    );
    log.error(error);
  }
}

function* convertEntityToInstanceSaga(
  action: ReduxAction<ConvertEntityToInstanceActionPayload>,
) {
  const { initiatedFromPathname, moduleType, packageId, publicEntityId } =
    action.payload;
  const workspaceId: string = yield select(getCurrentWorkspaceId);

  try {
    const payload: ConvertEntityToInstancePayload = {
      publicEntityId,
      packageId,
      moduleType,
    };
    const entity: Action = yield select(getActionById, {
      match: {
        params: {
          apiId: publicEntityId,
        },
      },
    });

    const response: ApiResponse<ConvertEntityToInstanceResponse> = yield call(
      ModuleInstanceApi.convertEntityToInstance,
      payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield fork(fetchPackagesForWorkspaceSaga, {
        type: ReduxActionTypes.FETCH_PACKAGES_FOR_WORKSPACE_INIT,
        payload: { workspaceId },
      });

      yield put({
        type: ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS,
        payload: {
          ...response?.data,
          module: {
            ...response.data.module,
            pluginId: entity.pluginId,
            pluginType: entity.pluginType,
            moduleType,
          },
          originalEntityId: publicEntityId,
        },
      });

      analytics.createModule({
        ...response.data.module,
        from: publicEntityId,
      });

      analytics.createModuleInstance(
        response.data.moduleInstanceData.moduleInstance,
      );

      if (!packageId) {
        analytics.createPackage(response.data.packageData);
      }

      if (location.pathname === initiatedFromPathname) {
        const { moduleInstance } = response.data.moduleInstanceData;
        const redirectUrl = moduleInstanceEditorURL({
          moduleInstanceId: moduleInstance.id,
          moduleType: moduleInstance.type,
        });

        if (redirectUrl) {
          history.push(redirectUrl);
        }
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CONVERT_ENTITY_TO_INSTANCE_ERROR,
      payload: {
        publicEntityId,
        moduleType,
      },
    });

    log.error(error);
  }
}

/**
 * Handles mod + enter global action for module instances only.
 */
function* runActionShortcutSaga() {
  const pathname = window.location.pathname;
  const baseMatch = matchBasePath(pathname);

  if (!baseMatch) return;

  const { path } = baseMatch;
  const match = matchPath<ModuleInstanceRouteParams>(pathname, {
    path: [`${path}${MODULE_INSTANCE_ID_PATH}`],
    exact: true,
  });

  if (!match || !match.params) return;

  const { moduleInstanceId } = match.params;

  if (moduleInstanceId) {
    const moduleInstance: ModuleInstance | undefined = yield select(
      getModuleInstanceById,
      moduleInstanceId,
    );

    if (!moduleInstance) return;

    if (moduleInstance.type === MODULE_TYPE.QUERY) {
      yield put(runQueryModuleInstance({ id: moduleInstanceId }));
    }

    if (moduleInstance.type === MODULE_TYPE.JS) {
      const publicJSCollection: JSCollection = yield select(
        getModuleInstancePublicEntity,
        moduleInstanceId,
        MODULE_TYPE.JS,
      );
      const activeJSActionId: string = yield select(
        getModuleInstanceActiveJSActionId,
        publicJSCollection?.id || "",
      );
      const action = getActionFromJsCollection(
        activeJSActionId,
        publicJSCollection,
      );

      if (!action) return;

      yield put(
        startExecutingJSFunction({
          action,
          collection: publicJSCollection,
          from: "KEYBOARD_SHORTCUT",
          openDebugger: true,
        }),
      );
    }
  }
}

function* copyModuleInstanceSaga(
  action: ReduxAction<CopyMoveModuleInstancePayload>,
) {
  try {
    const currentPageId: string = yield select(getCurrentPageId);
    const newName: string = yield select(getNewEntityName, {
      prefix: action.payload.name,
      parentEntityId: action.payload.destinationContextId,
      parentEntityKey: CreateNewActionKey.PAGE,
      suffix: "Copy",
      startWithoutIndex: true,
    });

    const response: ApiResponse<CreateModuleInstanceResponse> =
      yield ModuleInstancesApi.copyModuleInstance({
        ...action.payload,
        name: newName,
      });

    const isValidResponse: boolean = yield validateResponse(response);

    const pageName: string = yield select(
      getPageNameByPageId,
      response.data.moduleInstance.contextId,
    );

    if (isValidResponse) {
      toast.show(
        createMessage(
          MODULE_INSTANCE_COPY_SUCCESS,
          action.payload.name,
          pageName,
        ),
        {
          kind: "success",
        },
      );
    }

    if (currentPageId === action.payload.destinationContextId) {
      yield put({
        type: ReduxActionTypes.COPY_MODULE_INSTANCE_SUCCESS,
        payload: response.data,
      });
    }

    history.push(
      moduleInstanceEditorURL({
        pageId: response.data.moduleInstance.contextId,
        moduleType: response.data.moduleInstance.type,
        moduleInstanceId: response.data.moduleInstance.id,
      }),
    );
  } catch (e) {
    toast.show(createMessage(MODULE_INSTANCE_COPY_ERROR, action.payload.name), {
      kind: "error",
    });
    yield put({
      type: ReduxActionErrorTypes.COPY_MODULE_INSTANCE_ERROR,
    });
  }
}

function* moveModuleInstanceSaga(
  action: ReduxAction<CopyMoveModuleInstancePayload>,
) {
  try {
    const newName: string = yield select(getNewEntityName, {
      prefix: `${action.payload.name}`,
      parentEntityId: action.payload.destinationContextId,
      parentEntityKey: CreateNewActionKey.PAGE,
      startWithoutIndex: true,
    });

    const response: ApiResponse<CreateModuleInstanceResponse> =
      yield ModuleInstanceApi.moveModuleInstance({
        ...action.payload,
        name: newName,
      });

    const isValidResponse: boolean = yield validateResponse(response);
    const pageName: string = yield select(
      getPageNameByPageId,
      action.payload.destinationContextId,
    );
    if (isValidResponse) {
      toast.show(
        createMessage(
          MODULE_INSTANCE_MOVE_SUCCESS,
          response.data.moduleInstance.name,
          pageName,
        ),
        {
          kind: "success",
        },
      );
    }

    const currentUrl = window.location.pathname;
    yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);
    yield put({
      type: ReduxActionTypes.MOVE_MODULE_INSTANCE_SUCCESS,
      payload: response.data,
    });

    history.push(
      moduleInstanceEditorURL({
        pageId: response.data.moduleInstance.contextId,
        moduleType: response.data.moduleInstance.type,
        moduleInstanceId: response.data.moduleInstance.id,
      }),
    );
  } catch (e) {
    toast.show(createMessage(MODULE_INSTANCE_MOVE_ERROR, action.payload.name), {
      kind: "error",
    });
    yield put({
      type: ReduxActionErrorTypes.MOVE_MODULE_INSTANCE_ERROR,
    });
  }
}

// Watcher Saga
export default function* moduleInstanceSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.CREATE_MODULE_INSTANCE_INIT,
      createModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_INIT,
      fetchModuleInstancesSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INSTANCE_INIT,
      updateModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_INIT,
      updateModuleInstanceSettingsSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT,
      updateModuleInstanceOnPageLoadSettingsSaga,
    ),
    takeLatest(
      ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
      setupModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_INIT,
      setupModuleInstanceForViewSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
      fetchModuleInstanceEntitiesSaga,
    ),
    takeLatest(
      ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT,
      deleteModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT,
      saveModuleInstanceNameSaga,
    ),
    takeLatest(
      ReduxActionTypes.RUN_QUERY_MODULE_INSTANCE_INIT,
      runQueryModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_INIT,
      convertEntityToInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.RUN_ACTION_SHORTCUT_REQUEST,
      runActionShortcutSaga,
    ),
    takeLatest(
      ReduxActionTypes.COPY_MODULE_INSTANCE_INIT,
      copyModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.MOVE_MODULE_INSTANCE_INIT,
      moveModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_DUMMY_MODULE_INSTANCES_INIT,
      generateDummyInstanceAndEntitiesForUnusedModules,
    ),
  ]);
}
