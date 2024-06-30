import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import type {
  WorkflowActivityExecutionStatus,
  WorkflowExecutionStatus,
} from "@appsmith/pages/Editor/WorkflowEditor/BottomBar/WorkflowRunHistory/helpers";
import { RUN_HISTORY_TAB_KEYS } from "@appsmith/pages/Editor/WorkflowEditor/BottomBar/WorkflowRunHistory/helpers";

export interface WorkflowHistoryPaneContext {
  selectedTab: string;
  scrollPosition: number;
  responseTabHeight: number;
}

export interface WorkflowRunHistoryData {
  workflowRunId: string;
  startTime: string;
  endTime: string;
  status: WorkflowExecutionStatus;
}

export interface WorkflowRunHistoryState {
  isLoading: boolean;
  data: Array<WorkflowRunHistoryData>;
}

export interface WorkflowRunDetailsData {
  workflowStatus: WorkflowExecutionStatus;
  activities: Array<WorkflowRunDetailsActivities>;
}

export interface WorkflowRunDetailsActivities {
  activityId: string;
  description: string;
  eventTime: string;
  status: WorkflowActivityExecutionStatus;
  result: Record<string, any> | Array<Record<string, any>>;
}

export interface WorkflowRunDetailsState {
  isLoading: boolean;
  data: Record<string, WorkflowRunDetailsData>;
}

export interface WorkflowTestRunContext {
  isTriggering: boolean;
  testRunId: string;
}

export interface WorkflowHistoryPaneState {
  isOpen: boolean;
  context: WorkflowHistoryPaneContext;
  workflowRunHistory: WorkflowRunHistoryState;
  workflowRunDetails: WorkflowRunDetailsState;
  testRunContext: WorkflowTestRunContext;
}

const initialState: WorkflowHistoryPaneState = {
  isOpen: false,
  context: {
    selectedTab: RUN_HISTORY_TAB_KEYS.RUN_HISTORY,
    scrollPosition: 0,
    responseTabHeight: ActionExecutionResizerHeight,
  },
  workflowRunHistory: {
    isLoading: false,
    data: [],
  },
  workflowRunDetails: {
    isLoading: false,
    data: {},
  },
  testRunContext: {
    isTriggering: false,
    testRunId: "",
  },
};

export const handlers = {
  [ReduxActionTypes.OPEN_WORKFLOW_RUN_HISTORY_PANE]: (
    state: WorkflowHistoryPaneState,
  ) => {
    return {
      ...state,
      isOpen: true,
    };
  },
  [ReduxActionTypes.CLOSE_WORKFLOW_RUN_HISTORY_PANE]: (
    state: WorkflowHistoryPaneState,
  ) => {
    return {
      ...state,
      isOpen: false,
    };
  },
  [ReduxActionTypes.SET_JS_PANE_DEBUGGER_STATE]: (
    state: WorkflowHistoryPaneState,
  ) => {
    return {
      ...state,
      isOpen: false,
    };
  },
  [ReduxActionTypes.SET_QUERY_PANE_DEBUGGER_STATE]: (
    state: WorkflowHistoryPaneState,
  ) => {
    return {
      ...state,
      isOpen: false,
    };
  },
  [ReduxActionTypes.SET_API_PANE_DEBUGGER_STATE]: (
    state: WorkflowHistoryPaneState,
  ) => {
    return {
      ...state,
      isOpen: false,
    };
  },
  [ReduxActionTypes.SET_WORKFLOW_RUN_HISTORY_TAB]: (
    state: WorkflowHistoryPaneState,
    action: { selectedTab: string },
  ) => {
    state.context.selectedTab = action.selectedTab;
  },
  [ReduxActionTypes.SET_WORKFLOW_RUN_RESPONSE_PANE_HEIGHT]: (
    state: WorkflowHistoryPaneState,
    action: { height: number },
  ) => {
    state.context.responseTabHeight = action.height;
  },
  [ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_INIT]: (
    state: WorkflowHistoryPaneState,
  ) => {
    state.workflowRunHistory.isLoading = true;
  },
  [ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_SUCCESS]: (
    state: WorkflowHistoryPaneState,
    action: ReduxAction<Array<WorkflowRunHistoryData>>,
  ) => {
    state.workflowRunHistory.isLoading = false;
    state.workflowRunHistory.data = action.payload;
  },
  [ReduxActionErrorTypes.FETCH_WORKFLOW_RUN_HISTORY_ERROR]: (
    state: WorkflowHistoryPaneState,
  ) => {
    state.workflowRunHistory.isLoading = false;
  },
  [ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_INIT]: (
    state: WorkflowHistoryPaneState,
  ) => {
    state.workflowRunDetails.isLoading = true;
  },
  [ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_SUCCESS]: (
    state: WorkflowHistoryPaneState,
    action: ReduxAction<Record<string, WorkflowRunDetailsData>>,
  ) => {
    state.workflowRunDetails.isLoading = false;
    state.workflowRunDetails.data = {
      ...state.workflowRunDetails.data,
      ...action.payload,
    };
  },
  [ReduxActionErrorTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_ERROR]: (
    state: WorkflowHistoryPaneState,
  ) => {
    state.workflowRunDetails.isLoading = false;
  },
  [ReduxActionTypes.TRIGGER_TEST_WORKFLOW_INIT]: (
    state: WorkflowHistoryPaneState,
  ) => {
    state.testRunContext.isTriggering = true;
  },
  [ReduxActionTypes.TRIGGER_TEST_WORKFLOW_SUCCESS]: (
    state: WorkflowHistoryPaneState,
    action: ReduxAction<{ workflowRunId: string }>,
  ) => {
    state.testRunContext.isTriggering = false;
    state.testRunContext.testRunId = action.payload.workflowRunId;
  },
  [ReduxActionErrorTypes.TRIGGER_TEST_WORKFLOW_ERROR]: (
    state: WorkflowHistoryPaneState,
  ) => {
    state.testRunContext.isTriggering = false;
  },
};

const workflowHistoryPaneReducer = createImmerReducer(initialState, handlers);

export default workflowHistoryPaneReducer;
