export * from "ce/pages/Editor/IDE/EditorPane/JS/hooks";

import {
  useGroupedAddJsOperations as CE_useGroupedAddJsOperations,
  useJSSegmentRoutes as CE_useJSSegmentRoutes,
} from "ce/pages/Editor/IDE/EditorPane/JS/hooks";

import { useSelector } from "react-redux";
import { FocusEntity } from "navigation/FocusEntity";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { useModuleOptions } from "@appsmith/utils/moduleInstanceHelpers";
import { groupBy } from "lodash";
import type { GroupedAddOperations } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import type { UseRoutes } from "@appsmith/entities/IDE/constants";
import ModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/appRoutes";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";

/**
 * Updating to add JS module options in the list of Add JS Operations.
 * **/
export const useGroupedAddJsOperations = (): GroupedAddOperations => {
  const ce_jsOperations = CE_useGroupedAddJsOperations();
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const packageJSModuleGroups = groupBy(jsModuleCreationOptions, "tooltip");
  const jsOperations = [...ce_jsOperations];
  Object.entries(packageJSModuleGroups).forEach(([packageTitle, modules]) => {
    jsOperations.push({
      title: packageTitle,
      className: `t--${packageTitle}`,
      operations: modules,
    });
  });

  return jsOperations;
};

export const useJSSegmentRoutes = (path: string): UseRoutes => {
  const ceRoutes = CE_useJSSegmentRoutes(path);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  if (isSideBySideEnabled && editorMode === EditorViewMode.SplitScreen) {
    return [
      {
        key: "ModuleInstanceEditor",
        component: ModuleInstanceEditor,
        exact: true,
        path: [
          BUILDER_PATH + MODULE_INSTANCE_ID_PATH,
          BUILDER_CUSTOM_PATH + MODULE_INSTANCE_ID_PATH,
          BUILDER_PATH_DEPRECATED + MODULE_INSTANCE_ID_PATH,
        ],
      },
      ...ceRoutes,
    ];
  }
  return ceRoutes;
};
