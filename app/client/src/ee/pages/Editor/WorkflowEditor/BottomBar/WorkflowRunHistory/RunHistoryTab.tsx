import React, { useState } from "react";
import styled from "styled-components";
import { RunHistoryList } from "./RunHistoryList";
import { Divider } from "design-system";
import { useSelector } from "react-redux";
import { getCurrentWorkflowId } from "@appsmith/selectors/workflowSelectors";
import { RunHistoryDetailsList } from "./RunHistoryDetailsList";
import { APP_MODE } from "entities/App";

export const RunHistoryTabContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

const HistoryTabContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 270px;
  overflow: hidden;
`;

export const HistoryDetailsTabContainer = styled.div`
  height: 100%;
  overflow: hidden;
  padding: 8px;
  padding-right: 0px;
  flex-grow: 2;
`;

export function RunHistoryTab() {
  const [selectedRunId, setSelectedRunId] = useState<string>("default");
  const workflowId = useSelector(getCurrentWorkflowId);
  return (
    <RunHistoryTabContainer>
      <HistoryTabContainer>
        <RunHistoryList
          selectedRunId={selectedRunId}
          setSelectedRunId={setSelectedRunId}
          workflowId={workflowId || ""}
        />
      </HistoryTabContainer>
      <Divider className="!block mb-[2px]" orientation="vertical" />
      <HistoryDetailsTabContainer>
        <RunHistoryDetailsList
          selectedRunId={selectedRunId}
          workflowId={workflowId || ""}
          workflowMode={APP_MODE.PUBLISHED}
        />
      </HistoryDetailsTabContainer>
    </RunHistoryTabContainer>
  );
}
