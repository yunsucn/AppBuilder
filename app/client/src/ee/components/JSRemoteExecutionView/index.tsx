import React, { useCallback, useMemo, useState } from "react";
import {
  HistoryDetailsTabContainer,
  RunHistoryTabContainer,
} from "@appsmith/pages/Editor/WorkflowEditor/BottomBar/WorkflowRunHistory/RunHistoryTab";
import { Divider, Flex } from "design-system";
import TestPayloadView from "./TestPayloadView";
import { RunHistoryDetailsList } from "@appsmith/pages/Editor/WorkflowEditor/BottomBar/WorkflowRunHistory/RunHistoryDetailsList";
import { getCurrentWorkflowId } from "@appsmith/selectors/workflowSelectors";
import { useDispatch, useSelector } from "react-redux";
import { isString } from "utils/helpers";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import EmptyPayloadView from "./EmptyPayloadView";
import { APP_MODE } from "entities/App";
import { getTestPayloadFromCollectionData } from "@appsmith/utils/actionExecutionUtils";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { debounce } from "lodash";

interface Props {
  collectionData?: JSCollectionData;
}

function JSRemoteExecutionView({ collectionData }: Props) {
  const dispatch = useDispatch();
  const [selectedRunId, setSelectedRunId] = useState("default");
  const workflowId = useSelector(getCurrentWorkflowId);
  const [value, setValue] = useState("");

  useMemo(() => {
    setValue(getTestPayloadFromCollectionData(collectionData));
  }, [setValue, collectionData]);

  const saveTestPayloadInRedux = useCallback(
    debounce((value) => {
      dispatch({
        type: ReduxActionTypes.UPDATE_TEST_PAYLOAD_FOR_JS_ACTION,
        payload: {
          collectionId: collectionData?.config.id || "",
          actionId: collectionData?.activeJSActionId || "",
          testPayload: value,
        },
      });
      dispatch({
        type: ReduxActionTypes.ENTITY_UPDATE_SUCCESS,
      });
    }, 100),
    [
      collectionData?.config.id,
      collectionData?.activeJSActionId,
      dispatch,
      debounce,
    ],
  );

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
      let value = "";
      if (typeof event !== "string") {
        value = event.target?.value;
      } else {
        value = event;
      }
      if (isString(value)) {
        setValue(value);
        saveTestPayloadInRedux(value);
      }
    },
    [setValue, saveTestPayloadInRedux],
  );

  const isInputValidJSON = useMemo(() => {
    if (!value || value.length === 0) return false;

    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  }, [value]);

  return (
    <RunHistoryTabContainer data-testid="t--js-remote-execution-view">
      <Flex
        flexDirection="column"
        height="80%"
        maxWidth="300px"
        minWidth="300px"
        overflow="hidden"
        width="300px"
      >
        <TestPayloadView
          actionId={collectionData?.activeJSActionId || ""}
          isInputValidJSON={isInputValidJSON}
          onChange={onChange}
          setSelectedRunId={setSelectedRunId}
          value={value}
          workflowId={workflowId || ""}
        />
      </Flex>
      <Divider className="!block" orientation="vertical" />
      <HistoryDetailsTabContainer>
        {!value || value.length === 0 ? (
          <EmptyPayloadView />
        ) : (
          <RunHistoryDetailsList
            selectedRunId={selectedRunId}
            workflowId={workflowId || ""}
            workflowMode={APP_MODE.EDIT}
          />
        )}
      </HistoryDetailsTabContainer>
    </RunHistoryTabContainer>
  );
}

export default JSRemoteExecutionView;
