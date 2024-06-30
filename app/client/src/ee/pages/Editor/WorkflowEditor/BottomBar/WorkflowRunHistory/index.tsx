import React, { useCallback } from "react";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import { useDispatch, useSelector } from "react-redux";
import {
  getRunHistoryResponsePaneHeight,
  getRunHistorySelectedTab,
} from "@appsmith/selectors/workflowRunHistorySelectors";
import { RUN_HISTORY_TAB_KEYS } from "./helpers";
import {
  setRunHistoryResponsePaneHeight,
  toggleRunHistoryPane,
} from "@appsmith/actions/workflowRunHistoryActions";
import { setDebuggerSelectedTab } from "actions/debuggerActions";
import {
  createMessage,
  WORKFLOW_RUN_HISTORY_PANE_TRIGGER_TAB,
} from "@appsmith/constants/messages";
import { RunHistoryTab } from "./RunHistoryTab";
import { IDEBottomView, ViewHideBehaviour } from "IDE";

function WorkflowRunHistoryPane() {
  const dispatch = useDispatch();
  const selectedTab = useSelector(getRunHistorySelectedTab);
  const responsePaneHeight = useSelector(getRunHistoryResponsePaneHeight);
  const updateResponsePaneHeight = useCallback((height: number) => {
    dispatch(setRunHistoryResponsePaneHeight(height));
  }, []);

  const setSelectedTab = (tabKey: string) => {
    if (tabKey === selectedTab) return;
    if (tabKey === "") tabKey = RUN_HISTORY_TAB_KEYS.RUN_HISTORY;
    dispatch(setDebuggerSelectedTab(tabKey));
  };
  const onClose = () => dispatch(toggleRunHistoryPane(false));

  const RUN_HISTORY_TABS = [
    {
      key: RUN_HISTORY_TAB_KEYS.RUN_HISTORY,
      title: createMessage(WORKFLOW_RUN_HISTORY_PANE_TRIGGER_TAB),
      panelComponent: <RunHistoryTab />,
    },
  ];
  return (
    <IDEBottomView
      behaviour={ViewHideBehaviour.CLOSE}
      height={responsePaneHeight}
      hidden={false}
      onHideClick={onClose}
      setHeight={updateResponsePaneHeight}
    >
      <EntityBottomTabs
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        onSelect={setSelectedTab}
        selectedTabKey={selectedTab}
        tabs={RUN_HISTORY_TABS}
      />
    </IDEBottomView>
  );
}

export default WorkflowRunHistoryPane;
