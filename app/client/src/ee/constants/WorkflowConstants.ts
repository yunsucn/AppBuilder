import type { Workflow as CE_Workflow } from "ce/constants/WorkflowConstants";

export type Workflow = CE_Workflow;

export type WorkflowMetadata = Pick<
  Workflow,
  "id" | "name" | "workspaceId" | "icon" | "color" | "modifiedAt" | "modifiedBy"
>;

export const DEFAULT_WORKFLOW_COLOR = "#9747FF1A";
export const DEFAULT_WORKFLOW_ICON = "workflows";
export const DEFAULT_WORKFLOW_PREFIX = "Untitled Workflow ";
export const WORKFLOW_SETTINGS_PANE_WIDTH = 250;
