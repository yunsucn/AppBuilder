import type {
  AnyReduxAction,
  EvaluationReduxAction,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";

export interface CreateWorkflowFromWorkspacePayload {
  workspaceId: string;
}

export interface FetchWorkflowPayload {
  workflowId: string;
}

export interface DeleteWorkflowPayload {
  id: string;
}

export interface InitWorkflowEditorPayload {
  workflowId: string;
}

export interface FetchWorkflowActionsPayload {
  workflowId: string;
}

export interface PublishWorkflowPayload {
  workflowId: string;
}

export const fetchAllWorkflowsForWorkspace = (payload: string) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_INIT,
    payload,
  };
};

export const fetchWorkflow = (payload: FetchWorkflowPayload) => ({
  type: ReduxActionTypes.FETCH_WORKFLOW_INIT,
  payload,
});

export const createWorkflowFromWorkspace = (
  payload: CreateWorkflowFromWorkspacePayload,
) => {
  return {
    type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_INIT,
    payload,
  };
};

export const setCurrentWorkflow = (id: string | null) => ({
  type: ReduxActionTypes.SET_CURRENT_WORKFLOW_ID,
  payload: { id },
});

export const initWorkflowEditor = (payload: InitWorkflowEditorPayload) => ({
  type: ReduxActionTypes.INITIALIZE_WORKFLOW_EDITOR,
  payload,
});

export const deleteWorkflow = (payload: DeleteWorkflowPayload) => {
  return {
    type: ReduxActionTypes.DELETE_WORKFLOW_INIT,
    payload,
  };
};

export const updateWorkflowName = (
  name: string,
  id: string,
  fromWorkspace = false,
) => {
  return {
    type: ReduxActionTypes.UPDATE_WORKFLOW_NAME_INIT,
    payload: {
      id,
      name,
      fromWorkspace,
    },
  };
};

export const createWorkflowQueryAction = (
  workflowId: string,
  from: EventLocation,
  datasourceId: string,
) => {
  return {
    type: ReduxActionTypes.CREATE_WORKFLOW_QUERY_ACTION,
    payload: {
      workflowId,
      from,
      datasourceId,
    },
  };
};

export const createWorkflowAPIAction = (
  workflowId: string,
  from: EventLocation,
  apiType?: string,
) => {
  return {
    type: ReduxActionTypes.CREATE_WORKFLOW_API_ACTION,
    payload: {
      workflowId,
      from,
      apiType,
    },
  };
};

export const createWorkflowJSCollection = (
  workflowId: string,
  from: EventLocation,
): ReduxAction<{ workflowId: string; from: EventLocation }> => ({
  type: ReduxActionTypes.CREATE_WORKFLOW_JS_ACTION,
  payload: { workflowId: workflowId, from: from },
});

export const fetchWorkflowActions = (
  { workflowId }: { workflowId: string },
  postEvalActions: Array<AnyReduxAction>,
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_WORKFLOW_ACTIONS_INIT,
    payload: { workflowId },
    postEvalActions,
  };
};

export const fetchWorkflowJSCollections = ({
  workflowId,
}: {
  workflowId: string;
}): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_WORKFLOW_JS_ACTIONS_INIT,
    payload: { workflowId },
  };
};

export const fetchAllWorkflowActionsSuccess = (
  postEvalActions: Array<AnyReduxAction>,
) => ({
  type: ReduxActionTypes.FETCH_ALL_WORKFLOWS_ENTITY_COMPLETION,
  postEvalActions,
  payload: undefined,
});

export const saveWorkflowActionName = (id: string, name: string) => {
  return {
    type: ReduxActionTypes.SAVE_ACTION_NAME_FOR_WORKFLOWS_INIT,
    payload: {
      id,
      name,
    },
  };
};

export const saveJSObjectNameForWorkflows = (payload: {
  id: string;
  name: string;
}) => ({
  type: ReduxActionTypes.SAVE_JS_OBJECT_NAME_FOR_WORKFLOWS_INIT,
  payload,
});

export const publishWorkflow = (payload: PublishWorkflowPayload) => {
  return {
    type: ReduxActionTypes.PUBLISH_WORKFLOW_INIT,
    payload,
  };
};

export const toggleWorkflowToken = (
  workflowId: string,
  isTokenCurrentlyGenerated: boolean,
) => {
  return {
    type: ReduxActionTypes.TOGGLE_WORKFLOW_TOKEN,
    payload: {
      workflowId,
      isTokenCurrentlyGenerated,
    },
  };
};

export const createWorkflowQueryInApp = (
  pageId: string,
  from: EventLocation,
) => {
  return {
    type: ReduxActionTypes.CREATE_WORKFLOW_QUERY_IN_APPLICATION,
    payload: {
      pageId,
      from,
    },
  };
};

export const triggerWorkflowTest = (payload: {
  workflowId: string;
  actionId: string;
  data: any;
}) => {
  return {
    type: ReduxActionTypes.TRIGGER_TEST_WORKFLOW_INIT,
    payload,
  };
};
