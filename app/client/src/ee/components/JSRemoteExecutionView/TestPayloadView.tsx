import React, { useEffect } from "react";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { Button, Text } from "design-system";
import styled from "styled-components";
import {
  TEST_PAYLOAD_VIEW_DESC,
  TEST_PAYLOAD_VIEW_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { triggerWorkflowTest } from "@appsmith/actions/workflowActions";
import {
  getWorkflowTestRunId,
  getWorkflowTestTriggerState,
} from "@appsmith/selectors/workflowSelectors";
import { storeActionTestPayload } from "utils/storage";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 16px;
  padding-right: 16px;
  height: 100%;

  /* This override is needed because the bottom tab edit the height of the codewrapper to account for footer
   The offending css can be found in src/components/editorComponents/EntityBottomTabs.tsx
   */
  & .t--code-editor-wrapper.codeWrapper {
    height: 60%;
    & .CodeMirror-scroll {
      box-sizing: border-box;
    }
  }
`;

const CTAContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row-reverse;
  margin-bottom: 8px;
  gap: 8px;
  margin-top: 16px;
`;

interface Props {
  actionId: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  isInputValidJSON: boolean;
  setSelectedRunId: (runId: string) => void;
  workflowId: string;
}

function TestPayloadView({
  actionId,
  isInputValidJSON,
  onChange,
  setSelectedRunId,
  value,
  workflowId,
}: Props) {
  const dispatch = useDispatch();
  const isLoading = useSelector(getWorkflowTestTriggerState);
  const testRunId = useSelector(getWorkflowTestRunId);

  useEffect(() => {
    if (!isLoading && testRunId.length > 0) {
      setSelectedRunId(testRunId);
    }
  }, [isLoading, testRunId]);
  const handleRunClick = () => {
    if (isLoading || !isInputValidJSON) return;
    dispatch(triggerWorkflowTest({ workflowId, actionId, data: value }));
    storeActionTestPayload({ actionId, testData: value });
  };
  return (
    <Container>
      <Text kind="heading-s">{createMessage(TEST_PAYLOAD_VIEW_TITLE)}</Text>
      <Text kind="action-s">{createMessage(TEST_PAYLOAD_VIEW_DESC)}</Text>
      <LazyCodeEditor
        border={CodeEditorBorder.ALL_SIDE}
        data-testid="t--remote-js-exec-test-payload-editor"
        height={"100%"}
        input={{
          value,
          onChange,
        }}
        mode={EditorModes.JSON}
        onEditorBlur={() => {
          dispatch({
            type: ReduxActionTypes.ENTITY_UPDATE_SUCCESS,
          });
        }}
        placeholder={`{ “key”:”value”, ...} or { }`}
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={EditorTheme.LIGHT}
      />
      <CTAContainer>
        <Button
          data-testid="t--remote-js-exec-run-button"
          isDisabled={!isInputValidJSON}
          isLoading={isLoading}
          kind="primary"
          onClick={handleRunClick}
        >
          Run
        </Button>
      </CTAContainer>
    </Container>
  );
}

export default TestPayloadView;
