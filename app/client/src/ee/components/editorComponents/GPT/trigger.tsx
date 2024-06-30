export * from "ce/components/editorComponents/GPT/trigger";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import {
  isAskAIEnabled,
  isAskAIJSEnabled,
  isAskAISQLEnabled,
  isAskAIFunctionCompletionEnabled,
} from "@appsmith/utils/planHelpers";
import {
  EditorModes,
  type TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { editorSQLModes } from "components/editorComponents/CodeEditor/sql/config";
import type { EntityTypeValue } from "@appsmith/entities/DataTree/types";

export const APPSMITH_AI = "Appsmith AI";

export function isAIEnabled(featureFlags: FeatureFlags, mode: TEditorModes) {
  let featureFlagValue: boolean = isAskAIEnabled(featureFlags);
  if (mode === editorSQLModes.POSTGRESQL_WITH_BINDING) {
    featureFlagValue = isAskAISQLEnabled(featureFlags);
  } else if (mode === EditorModes.TEXT_WITH_BINDING) {
    featureFlagValue = isAskAIJSEnabled(featureFlags);
  } else if (mode === EditorModes.JAVASCRIPT) {
    featureFlagValue = isAskAIFunctionCompletionEnabled(featureFlags);
  }
  return featureFlagValue;
}

export const isAISlashCommand = (editor: CodeMirror.Editor) => {
  const { line } = editor.getCursor();
  const trimmedLineContent = editor.getLine(line).trim();

  const hasAiCommand = /\/(ai?)?$/.test(trimmedLineContent);

  if (hasAiCommand) {
    return true;
  }

  return false;
};

export const getAIContext = ({
  cursorPosition,
  editor,
}: {
  entityType?: EntityTypeValue;
  slashIndex: number;
  currentLineValue: string;
  cursorPosition: CodeMirror.Position;
  editor: CodeMirror.Editor;
}) => {
  const aiContext = {
    cursorLineNumber: cursorPosition.line,
    mode: editor.getMode().name,
    cursorPosition,
    cursorCoordinates: editor.cursorCoords(true, "local"),
  };

  return aiContext;
};
