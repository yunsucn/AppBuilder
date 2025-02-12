export enum RUN_HISTORY_TAB_KEYS {
  RUN_HISTORY = "RUN_HISTORY",
}
export const HistoryStateFilterStates = {
  ALL_RUNS: "ALL_RUNS",
  FAILED_RUNS: "FAILED_RUNS",
};

export enum WorkflowExecutionStatus {
  WORKFLOW_EXECUTION_STATUS_UNSPECIFIED = 0,
  WORKFLOW_EXECUTION_STATUS_RUNNING = 1,
  WORKFLOW_EXECUTION_STATUS_COMPLETED = 2,
  WORKFLOW_EXECUTION_STATUS_FAILED = 3,
  WORKFLOW_EXECUTION_STATUS_CANCELED = 4,
  WORKFLOW_EXECUTION_STATUS_TERMINATED = 5,
  WORKFLOW_EXECUTION_STATUS_CONTINUED_AS_NEW = 6,
  WORKFLOW_EXECUTION_STATUS_TIMED_OUT = 7,
}

export enum WorkflowActivityExecutionStatus {
  SCHEDULED = 0,
  STARTED = 1,
  COMPLETED = 2,
  FAILED = 3,
  TIMED_OUT = 4,
  CONSOLE = 5,
}

const successStatuses = [
  WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_COMPLETED,
  WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_CONTINUED_AS_NEW,
];

const inProgressStatuses = [
  WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_RUNNING,
];

const inProgressActivityStatuses = [
  WorkflowActivityExecutionStatus.SCHEDULED,
  WorkflowActivityExecutionStatus.STARTED,
];

const failedActivityStatuses = [
  WorkflowActivityExecutionStatus.FAILED,
  WorkflowActivityExecutionStatus.TIMED_OUT,
];

const ERROR_ICON_PROPS = {
  name: "close-circle-line",
  color: "var(--ads-v2-color-fg-on-error)",
};

const SUCCESS_ICON_PROPS = {
  name: "check-line",
  color: "var(--ads-v2-color-fg-success)",
};

const IN_PROGRESS_ICON_PROPS = {
  name: "loader-line",
  color: "var(--ads-v2-color-border-emphasis-plus)",
};

const CONSOLE_ICON_PROPS = {
  name: "server-line",
  color: "var(--ads-v2-color-border-emphasis-plus)",
};

export const getWorkflowRunStatusIconProps = (
  status: WorkflowExecutionStatus,
) => {
  if (successStatuses.includes(status)) {
    return SUCCESS_ICON_PROPS;
  } else if (inProgressStatuses.includes(status)) {
    return IN_PROGRESS_ICON_PROPS;
  }
  return ERROR_ICON_PROPS;
};

export const getWorkflowActivityStatusIconProps = (
  status: WorkflowActivityExecutionStatus,
) => {
  if (failedActivityStatuses.includes(status)) {
    return ERROR_ICON_PROPS;
  } else if (inProgressActivityStatuses.includes(status)) {
    return IN_PROGRESS_ICON_PROPS;
  } else if (status === WorkflowActivityExecutionStatus.COMPLETED) {
    return SUCCESS_ICON_PROPS;
  }
  return CONSOLE_ICON_PROPS;
};
