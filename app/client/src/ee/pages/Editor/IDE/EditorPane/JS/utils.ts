export * from "ce/pages/Editor/IDE/EditorPane/JS/utils";

import {
  getJSEntityItemUrl as CE_getJSEntityItemUrl,
  getJSUrl as CE_getJSUrl,
} from "ce/pages/Editor/IDE/EditorPane/JS/utils";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { FocusEntity, type FocusEntityInfo } from "navigation/FocusEntity";

export const getJSEntityItemUrl = (
  item: EntityItem,
  pageId: string,
): string => {
  if (item.isModuleInstance) {
    return moduleInstanceEditorURL({
      pageId,
      moduleType: MODULE_TYPE.JS,
      moduleInstanceId: item.key,
    });
  }
  return CE_getJSEntityItemUrl(item, pageId);
};

export const getJSUrl = (
  item: FocusEntityInfo,
  add: boolean = true,
): string => {
  if (item.entity === FocusEntity.JS_MODULE_INSTANCE) {
    return moduleInstanceEditorURL({
      moduleInstanceId: item.id,
      add,
      moduleType: MODULE_TYPE.JS,
    });
  }
  return CE_getJSUrl(item, add);
};
