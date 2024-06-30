export * from "ce/pages/Editor/IDE/EditorPane/Query/utils";

import {
  getQueryEntityItemUrl as CE_getQueryEntityItemUrl,
  getQueryUrl as CE_getQueryAddUrl,
} from "ce/pages/Editor/IDE/EditorPane/Query/utils";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { FocusEntityInfo } from "navigation/FocusEntity";

export const getQueryEntityItemUrl = (
  item: EntityItem,
  pageId: string,
): string => {
  if (item.isModuleInstance) {
    return moduleInstanceEditorURL({
      pageId,
      moduleType: MODULE_TYPE.QUERY,
      moduleInstanceId: item.key,
    });
  }
  return CE_getQueryEntityItemUrl(item, pageId);
};

export const getQueryUrl = (
  item: FocusEntityInfo,
  add: boolean = true,
): string => {
  if (item.params.moduleInstanceId) {
    return moduleInstanceEditorURL({
      pageId: item.params.pageId,
      moduleType: MODULE_TYPE.QUERY,
      moduleInstanceId: item.params.moduleInstanceId,
      add,
    });
  }
  return CE_getQueryAddUrl(item, add);
};
