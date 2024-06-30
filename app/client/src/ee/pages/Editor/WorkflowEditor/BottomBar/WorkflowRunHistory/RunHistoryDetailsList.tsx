import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type { AppState } from "@appsmith/reducers";
import {
  getRunHistoryDetailsData,
  getRunHistoryDetailsLoadingState,
} from "@appsmith/selectors/workflowRunHistorySelectors";
import { useDispatch, useSelector } from "react-redux";
import { Text } from "design-system";
import { fetchWorkflowRunHistoryDetails } from "@appsmith/actions/workflowRunHistoryActions";
import { RunHistoryDetailsListItem } from "./RunHistoryDetailsListItem";
import styled from "styled-components";
import type { APP_MODE } from "entities/App";
import { WorkflowExecutionStatus } from "./helpers";

interface RunHistoryDetailsProps {
  workflowId: string;
  selectedRunId: string;
  workflowMode: APP_MODE;
}

const RunHistoryDetailsListContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  gap: 4px;
  height: 100%;
`;

export function RunHistoryDetailsList({
  selectedRunId,
  workflowId,
  workflowMode,
}: RunHistoryDetailsProps) {
  const dispatch = useDispatch();
  const isLoading = useSelector(getRunHistoryDetailsLoadingState);
  const data = useSelector((state: AppState) =>
    getRunHistoryDetailsData(state, selectedRunId),
  );
  // Interval to poll for run details
  const interval = useRef(0);

  const dispatchCallback = useCallback(() => {
    dispatch(
      fetchWorkflowRunHistoryDetails(workflowId, selectedRunId, workflowMode),
    );
  }, [dispatch, workflowId, selectedRunId, workflowMode]);

  const { activities, workflowStatus } = useMemo(() => {
    if (!data)
      return {
        workflowStatus:
          WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_UNSPECIFIED,
        activities: [],
      };
    return {
      workflowStatus:
        data.workflowStatus !== undefined
          ? data.workflowStatus
          : WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_FAILED,
      activities: data ? data.activities : [],
    };
  }, [data]);

  // Poll for run details every 2 seconds after last fetch
  useEffect(() => {
    if (selectedRunId === "default" || isLoading) return;
    if (
      workflowStatus ===
      WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_RUNNING
    ) {
      !!interval.current && clearInterval(interval.current);
      interval.current = setInterval(() => {
        dispatchCallback();
      }, 2000);
      return () => clearInterval(interval.current);
    } else if (
      workflowStatus ===
      WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_UNSPECIFIED
    ) {
      dispatchCallback();
    }
  }, [dispatchCallback, selectedRunId, workflowStatus, isLoading]);

  if (selectedRunId === "default") {
    return null;
  }

  return (
    <RunHistoryDetailsListContainer data-testid="t--run-history-details-list">
      {activities.length > 0
        ? activities.map((activity) => (
            <RunHistoryDetailsListItem
              data={activity}
              key={activity.activityId}
            />
          ))
        : null}
      {isLoading && <Text>Loading...</Text>}
    </RunHistoryDetailsListContainer>
  );
}
