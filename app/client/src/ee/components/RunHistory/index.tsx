import WorkflowRunHistoryPane from "@appsmith/pages/Editor/WorkflowEditor/BottomBar/WorkflowRunHistory";
import { getShowRunHistoryPaneState } from "@appsmith/selectors/workflowRunHistorySelectors";
import React from "react";
import { useSelector } from "react-redux";

export default function RunHistory() {
  // Run history render flag
  const paneVisible = useSelector(getShowRunHistoryPaneState);

  return paneVisible ? <WorkflowRunHistoryPane /> : null;
}
