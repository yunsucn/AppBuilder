import type { ApiResponse } from "api/ApiResponses";
import type { EvaluationReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getActions,
  getJSCollection,
  getJSCollections,
} from "@appsmith/selectors/entitiesSelector";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import type { Action, ApiAction } from "entities/Action";
import { PluginPackageName } from "entities/Action";
import { select, put, takeLatest, call, all, fork } from "redux-saga/effects";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import { validateResponse } from "sagas/ErrorSagas";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import {
  createActionRequest,
  updateActionData,
} from "actions/pluginActionActions";
import ActionAPI from "api/ActionAPI";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  fetchWorkflowActions,
  fetchWorkflowJSCollections,
  type FetchWorkflowActionsPayload,
} from "@appsmith/actions/workflowActions";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";
import {
  ActionParentEntityType,
  CreateNewActionKey,
} from "@appsmith/entities/Engine/actionHelpers";
import type { CreateJSCollectionRequest } from "@appsmith/api/JSActionAPI";
import JSActionAPI from "@appsmith/api/JSActionAPI";
import type { JSCollection } from "entities/JSCollection";
import type {
  JSCollectionData,
  JSCollectionDataState,
} from "@appsmith/reducers/entityReducers/jsActionsReducer";
import { createJSCollectionRequest } from "actions/jsActionActions";
import { generateDefaultJSObject } from "sagas/JSPaneSagas";
import { createDummyJSCollectionActions } from "utils/JSPaneUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import {
  getCurrentWorkflowId,
  getMainJsObjectIdOfCurrentWorkflow,
} from "@appsmith/selectors/workflowSelectors";
import { getPluginIdOfPackageName } from "sagas/selectors";
import { DEFAULT_DATASOURCE_NAME } from "constants/ApiEditorConstants/ApiEditorConstants";
import { checkAndGetPluginFormConfigsSaga } from "sagas/PluginSagas";
import { createNewWorkflowQueryName } from "@appsmith/utils/workflowHelpers";
import type {
  ActionData,
  ActionDataState,
} from "@appsmith/reducers/entityReducers/actionsReducer";
import { logActionExecutionError } from "sagas/ActionExecution/errorUtils";
import type { TWorkflowsAssignRequestDescription } from "@appsmith/workers/Evaluation/fns/workflowFns";
import { toast } from "design-system";
import {
  ERROR_ACTION_RENAME_FAIL,
  ERROR_JS_COLLECTION_RENAME_FAIL,
  createMessage,
} from "@appsmith/constants/messages";
import log from "loglevel";
import { ActionsNotFoundError } from "entities/Engine";
import { failFastApiCalls } from "sagas/InitSagas";
import { getTestPayloadFromCollectionData } from "ce/utils/actionExecutionUtils";
import { getJSCollectionDataById } from "selectors/editorSelectors";
import { fetchStoredTestPayloadsSaga } from "./JSActionSagas";

export function* fetchAllWorkflowActions(workflowId: string) {
  const initActionsCalls = [
    fetchWorkflowActions({ workflowId }, []),
    fetchWorkflowJSCollections({ workflowId }),
  ];

  const successActionEffects = [
    ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
    ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
  ];

  const failureActionEffects = [
    ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
    ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
  ];

  const allActionCalls: boolean = yield call(
    failFastApiCalls,
    initActionsCalls,
    successActionEffects,
    failureActionEffects,
  );
  if (!allActionCalls)
    throw new ActionsNotFoundError(
      `Unable to fetch actions for the workflow: ${workflowId}`,
    );
}

export function* createWorkflowQueryActionSaga(
  action: ReduxAction<{
    workflowId: string;
    datasourceId: string;
    from: EventLocation;
  }>,
) {
  const { datasourceId, from, workflowId } = action.payload;

  const createActionPayload: Partial<Action> = yield call(
    createDefaultActionPayloadWithPluginDefaults,
    {
      datasourceId,
      from,
    },
  );

  yield put(
    createActionRequest({
      ...createActionPayload,
      workflowId,
      contextType: ActionParentEntityType.WORKFLOW,
    }),
  );
}

/**
 * Creates an API with datasource as DEFAULT_REST_DATASOURCE (No user created datasource)
 * @param action
 */
export function* createWorkflowApiActionSaga(
  action: ReduxAction<{
    workflowId: string;
    from: EventLocation;
    apiType?: string;
  }>,
) {
  const {
    apiType = PluginPackageName.REST_API,
    from,
    workflowId,
  } = action.payload;

  if (workflowId) {
    const createApiActionPayload: Partial<ApiAction> = yield call(
      createDefaultApiActionPayload,
      {
        apiType,
        from,
      },
    );

    yield put(
      createActionRequest({
        ...createApiActionPayload,
        workflowId,
        contextType: ActionParentEntityType.WORKFLOW,
      }), // We don't have recursive partial in typescript for now.
    );
  }
}

export function* createDefaultWorkflowQueryPayload(props: {
  newActionName: string;
  from: EventLocation;
}) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const { from, newActionName } = props;
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    PluginPackageName.WORKFLOW,
  );

  yield call(checkAndGetPluginFormConfigsSaga, pluginId);

  return {
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      formData: {
        workflowId: {
          data: "",
        },
        requestType: {
          data: "GET_APPROVAL_REQUESTS",
        },
        requestStatus: {
          data: "PENDING",
        },
        limit: {
          data: "10",
        },
        skip: {
          data: "0",
        },
      },
    },
    name: newActionName,
    datasource: {
      name: DEFAULT_DATASOURCE_NAME,
      pluginId,
      workspaceId,
      datasourceConfiguration: {},
    },
    eventData: {
      actionType: "WORKFLOWS",
      from: from,
    },
  };
}

export function* createWorkflowQueryInApplication(
  action: ReduxAction<{
    pageId: string;
    from: EventLocation;
  }>,
) {
  const { from, pageId } = action.payload;

  if (pageId) {
    const actions: ActionDataState = yield select(getActions);
    const newActionName = createNewWorkflowQueryName(actions, pageId || "");
    // Note: Do NOT send pluginId on top level here.
    // It breaks embedded rest datasource flow.

    const createApiActionPayload: Partial<ApiAction> = yield call(
      createDefaultWorkflowQueryPayload,
      {
        from,
        newActionName,
      },
    );

    yield put(
      createActionRequest({
        ...createApiActionPayload,
        pageId,
      }),
    );
  }
}

export function* fetchWorkflowActionsSaga(
  action: EvaluationReduxAction<FetchWorkflowActionsPayload>,
) {
  const { workflowId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_ACTIONS_API,
    { mode: "EDITOR", appId: workflowId },
  );
  try {
    const response: ApiResponse<Action[]> = yield ActionAPI.fetchActions({
      workflowId,
    });
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        payload: response.data,
        postEvalActions: action.postEvalActions,
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_ACTIONS_API,
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: { error },
    });
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_ACTIONS_API,
      { failed: true },
    );
  }
}

export function* fetchWorkflowJSCollectionsSaga(
  action: EvaluationReduxAction<FetchWorkflowActionsPayload>,
) {
  const { workflowId } = action.payload;
  try {
    const response: ApiResponse<JSCollection[]> =
      yield JSActionAPI.fetchJSCollections({ workflowId });

    const mainJsObjectIdOfCurrentWorkflow: string = yield select(
      getMainJsObjectIdOfCurrentWorkflow,
    );

    let updatedResponse: JSCollection[] = [];
    if (response.data.length > 0) {
      updatedResponse = response.data.map((jsCollection) => {
        if (jsCollection.id === mainJsObjectIdOfCurrentWorkflow) {
          return {
            ...jsCollection,
            isMainJSCollection: true,
          };
        }
        return jsCollection;
      });
    }
    yield put({
      type: ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      payload: updatedResponse || [],
    });
    yield call(fetchStoredTestPayloadsSaga, updatedResponse);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* createWorkflowJSActionSaga(
  action: ReduxAction<{ workflowId: string; from: EventLocation }>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const { from, workflowId } = action.payload;

  if (workflowId) {
    const jsActions: JSCollectionDataState = yield select(getJSCollections);
    const workflowJsActions = jsActions.filter(
      (a: JSCollectionData) => a.config.workflowId === workflowId,
    );
    const newJSCollectionName = createNewJSFunctionName(
      workflowJsActions,
      workflowId,
      CreateNewActionKey.WORKFLOW,
    );
    const { actions, body, variables } =
      createDummyJSCollectionActions(workspaceId);

    const defaultJSObject: CreateJSCollectionRequest =
      yield generateDefaultJSObject({
        name: newJSCollectionName,
        workspaceId,
        actions,
        body,
        variables,
      });

    yield put(
      createJSCollectionRequest({
        from: from,
        request: {
          ...defaultJSObject,
          workflowId,
          contextType: ActionParentEntityType.WORKFLOW,
        },
      }),
    );
  }
}

export function* handleAssignRequestOnBrowserRun(
  action: TWorkflowsAssignRequestDescription,
) {
  const { requestName, requestToGroups, requestToUsers, resolutions } =
    action.payload;

  // requestName is required, if not present, log error and return

  let errorMessage = "";
  if (!requestName)
    errorMessage =
      "Missing parameter: Provide a valid value for 'requestName'.";

  // resolutions is required, if not present, log error and return
  if (!resolutions || resolutions.length === 0)
    errorMessage =
      "Missing parameter: Provide a valid value for 'resolutions'.";

  // at least one of requestToUsers or requestToGroups is required and should have length>0,
  // If not present, log error and return
  if (
    (!requestToUsers || requestToUsers.length === 0) &&
    (!requestToGroups || requestToGroups.length === 0)
  )
    errorMessage =
      "Missing parameter: Provide a valid 'requestToUsers' or 'requestToGroups'";

  // check if requestToUsers is an array if not undefined
  if (!!requestToUsers && !Array.isArray(requestToUsers))
    errorMessage =
      "Invalid parameter: 'requestToUsers' should be an array of user emails.";

  // check if requestToGroups is an array if not undefined
  if (!!requestToGroups && !Array.isArray(requestToGroups))
    errorMessage =
      "Invalid parameter: 'requestToGroups' should be an array of user groups.";

  if (errorMessage) {
    yield call(logActionExecutionError, errorMessage, true);
    return;
  }

  // add artificial delay of to simulate the request
  yield call(async () => new Promise((resolve) => setTimeout(resolve, 1000)));

  // return the first value of resolutions array as the resolution
  const resolution = resolutions[0];
  return { resolution };
}

export function* refactorJSObjectName(
  id: string,
  workflowId: string,
  oldName: string,
  newName: string,
) {
  // call to refactor action
  const refactorResponse: ApiResponse =
    yield JSActionAPI.updateJSCollectionOrActionName({
      actionCollectionId: id,
      oldName: oldName,
      newName: newName,
      workflowId,
      contextType: ActionParentEntityType.WORKFLOW,
    });

  const isRefactorSuccessful: boolean =
    yield validateResponse(refactorResponse);

  if (isRefactorSuccessful) {
    yield put({
      type: ReduxActionTypes.SAVE_JS_COLLECTION_NAME_SUCCESS,
      payload: {
        actionId: id,
      },
    });
    const jsObject: JSCollection = yield select((state) =>
      getJSCollection(state, id),
    );
    const functions = jsObject.actions;
    yield put(
      updateActionData(
        functions.map((f) => ({
          entityName: newName,
          data: undefined,
          dataPath: `${f.name}.data`,
          dataPathRef: `${oldName}.${f.name}.data`,
        })),
      ),
    );
  }
}

export function* refactorActionNameForWorkflows(
  id: string,
  workflowId: string,
  oldName: string,
  newName: string,
) {
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.REFACTOR_ACTION_NAME,
    { actionId: id },
  );

  // call to refactor action
  const refactorResponse: ApiResponse = yield ActionAPI.updateActionName({
    actionId: id,
    oldName: oldName,
    newName: newName,
    workflowId,
    contextType: ActionParentEntityType.WORKFLOW,
  });

  const isRefactorSuccessful: boolean =
    yield validateResponse(refactorResponse);

  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.REFACTOR_ACTION_NAME,
    { isSuccess: isRefactorSuccessful },
  );
  if (isRefactorSuccessful) {
    yield put({
      type: ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
      payload: {
        actionId: id,
      },
    });
    yield put(
      updateActionData([
        {
          entityName: newName,
          dataPath: "data",
          data: undefined,
          dataPathRef: `${oldName}.data`,
        },
      ]),
    );
  }
}

export function* saveActionNameForWorkflowsSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  const { id, name } = action.payload;
  const actions: ActionDataState = yield select(getActions);
  const actionToBeUpdated: ActionData | undefined = actions.find(
    (action) => action.config.id === id,
  );
  const workflowId = actionToBeUpdated?.config.workflowId;

  try {
    if (workflowId) {
      yield refactorActionNameForWorkflows(
        id,
        workflowId,
        actionToBeUpdated?.config.name || "",
        name,
      );

      yield fork(fetchAllWorkflowActions, workflowId);
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
      payload: {
        actionId: action.payload.id,
        oldName: actionToBeUpdated?.config.name,
      },
    });
    toast.show(createMessage(ERROR_ACTION_RENAME_FAIL, action.payload.name), {
      kind: "error",
    });
    log.error(e);
  }
}

export function* saveJSObjectNameForWorkflowsSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  const { id, name } = action.payload;
  const jsActions: JSCollectionDataState = yield select(getJSCollections);
  const jsActionToBeUpdated: JSCollectionData | undefined = jsActions.find(
    (jsaction) => jsaction.config.id === id,
  );
  const workflowId = jsActionToBeUpdated?.config.workflowId;

  try {
    if (workflowId) {
      yield refactorJSObjectName(
        id,
        workflowId,
        jsActionToBeUpdated?.config.name || "",
        name,
      );

      yield fork(fetchAllWorkflowActions, workflowId);
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_JS_COLLECTION_NAME_ERROR,
      payload: {
        actionId: action.payload.id,
        oldName: jsActionToBeUpdated?.config.name,
      },
    });
    toast.show(
      createMessage(ERROR_JS_COLLECTION_RENAME_FAIL, action.payload.name),
      {
        kind: "error",
      },
    );
    log.error(e);
  }
}

function* handleExecuteRemoteJSAction(
  action: ReduxAction<{ collectionId: string }>,
) {
  const { collectionId } = action.payload;
  // fetch the action's test payload
  const collectionData: JSCollectionData = yield select(
    getJSCollectionDataById,
    collectionId,
  );

  // if the action is part of a workflow, trigger the test
  if (collectionData.config.contextType === ActionParentEntityType.WORKFLOW) {
    const testPayload = getTestPayloadFromCollectionData(collectionData);
    if (!!testPayload) {
      const workflowId: string = yield select(getCurrentWorkflowId);
      yield put({
        type: ReduxActionTypes.TRIGGER_TEST_WORKFLOW_INIT,
        payload: {
          actionId: collectionData.activeJSActionId,
          workflowId,
          data: testPayload,
        },
      });
    }
  }
}

export default function* workflowsActionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.CREATE_WORKFLOW_QUERY_ACTION,
      createWorkflowQueryActionSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_WORKFLOW_API_ACTION,
      createWorkflowApiActionSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_WORKFLOW_JS_ACTION,
      createWorkflowJSActionSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_WORKFLOW_QUERY_IN_APPLICATION,
      createWorkflowQueryInApplication,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_WORKFLOW_ACTIONS_INIT,
      fetchWorkflowActionsSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_WORKFLOW_JS_ACTIONS_INIT,
      fetchWorkflowJSCollectionsSaga,
    ),
    takeLatest(
      ReduxActionTypes.SAVE_ACTION_NAME_FOR_WORKFLOWS_INIT,
      saveActionNameForWorkflowsSaga,
    ),
    takeLatest(
      ReduxActionTypes.SAVE_JS_OBJECT_NAME_FOR_WORKFLOWS_INIT,
      saveJSObjectNameForWorkflowsSaga,
    ),
    takeLatest(
      ReduxActionTypes.JS_ACTION_REMOTE_EXECUTION_INIT,
      handleExecuteRemoteJSAction,
    ),
  ]);
}
