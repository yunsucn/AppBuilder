export * from "ce/utils/moduleInstanceHelpers";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { useSelector } from "react-redux";
import {
  convertModulesToArray,
  getModuleIdPackageNameMap,
} from "./Packages/moduleHelpers";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { createModuleInstance } from "@appsmith/actions/moduleInstanceActions";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import { getPackages } from "@appsmith/selectors/packageSelectors";
import { sortBy } from "lodash";
import { FocusEntity } from "navigation/FocusEntity";
import { getPluginImages } from "@appsmith/selectors/entitiesSelector";
import { resolveIcon } from "pages/Editor/utils";

export const useModuleOptions = (): ActionOperation[] => {
  const allModules = useSelector(getAllModules);
  const modules = convertModulesToArray(allModules);
  const packages = useSelector(getPackages);
  const pluginImages = useSelector(getPluginImages);
  const modulePackageMap = getModuleIdPackageNameMap(modules, packages);
  const sortedModules = sortBy(modules, (module) => module.name.toUpperCase());

  const moduleOptions = sortedModules.map((module) => {
    return {
      title: `${module.name}`,
      desc: `Create a ${module.name} instance`,
      icon: resolveIcon({
        iconLocation: pluginImages[module.pluginId] || "",
        pluginType: module.pluginType,
        moduleType: module.type,
      }),
      kind: SEARCH_ITEM_TYPES.actionOperation,
      action: (pageId: string) =>
        createModuleInstance({
          contextId: pageId,
          contextType: ModuleInstanceCreatorType.PAGE,
          sourceModuleId: module.id,
        }),
      tooltip: `From ${modulePackageMap[module.id]} package`,
      focusEntityType:
        module.type === MODULE_TYPE.QUERY
          ? FocusEntity.QUERY_MODULE_INSTANCE
          : FocusEntity.JS_MODULE_INSTANCE,
      isBeta: true,
    };
  });

  return moduleOptions || [];
};
