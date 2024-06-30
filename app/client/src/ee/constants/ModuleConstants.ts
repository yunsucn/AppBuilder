export * from "ce/constants/ModuleConstants";
import type {
  Module as CE_Module,
  ModuleInputSection as CE_ModuleInputSection,
  ModuleInput as CE_ModuleInput,
  ModuleMetadata as CE_ModuleMetadata,
} from "ce/constants/ModuleConstants";
import type { ControlData } from "components/formControls/BaseControl";
import type { Action } from "entities/Action";
import type { JSCollection } from "entities/JSCollection";

export enum MODULE_TYPE {
  QUERY = "QUERY_MODULE",
  JS = "JS_MODULE",
  UI = "UI_MODULE",
}
export enum MODULE_PREFIX {
  QUERY = "Query",
  JS = "JS",
}
export interface PluginSettings {
  id: number;
  sectionName: string;
  children: ControlData[];
}

export interface ModuleInput extends CE_ModuleInput {
  label: string;
  defaultValue: string;
  controlType: string;
}

export interface PluginSettings {
  id: number;
  sectionName: string;
  children: ControlData[];
}

export interface ModuleInputSection extends CE_ModuleInputSection {
  sectionName: string;
  children: ModuleInput[];
}

export interface BaseModule extends CE_Module {
  inputsForm: ModuleInputSection[];
  settingsForm: PluginSettings[];
  type: MODULE_TYPE;
  userPermissions: string[];
  originModuleId?: string;
}

export interface ModuleMetadata extends CE_ModuleMetadata {
  publicEntity: Action | JSCollection;
}

export type Module = BaseModule &
  Pick<ModuleMetadata, "datasourceId" | "pluginId" | "pluginType">;

export enum MODULE_ENTITY_TYPE {
  ACTION = "ACTION",
  JS_OBJECT = "JS_OBJECT",
}

export const ENTITY_EXPLORER_RENDER_ORDER = [
  MODULE_TYPE.UI,
  MODULE_TYPE.JS,
  MODULE_TYPE.QUERY,
];

export enum MODULE_EDITOR_TYPE {
  QUERY = "QUERY",
  API = "API",
}
