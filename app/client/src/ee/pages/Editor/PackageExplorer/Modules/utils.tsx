import type { Module } from "@appsmith/constants/ModuleConstants";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { klona } from "klona";
import { groupBy, sortBy } from "lodash";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";

type ModulesMap = Record<MODULE_TYPE, Module[]>;

interface HandlerProps {
  modules: Module[];
}

interface GroupModulesProps {
  modules: ModulesReducerState;
}

const jsModuleHandler = ({ modules }: HandlerProps) => {
  return modules;
};

const queryModuleHandler = ({ modules }: HandlerProps) => {
  const modulesGroupedByPluginType = groupBy(modules, (m) => m.pluginType);

  let groupedModules: Module[] = [];

  Object.values(modulesGroupedByPluginType).forEach((modules) => {
    const groupModulesByDatasourceId = groupBy(modules, (m) => m.datasourceId);

    Object.values(groupModulesByDatasourceId).forEach((modules) => {
      groupedModules = [...groupedModules, ...modules];
    });
  });

  return groupedModules;
};

const handlers = {
  [MODULE_TYPE.QUERY]: queryModuleHandler,
  [MODULE_TYPE.JS]: jsModuleHandler,
  [MODULE_TYPE.UI]: undefined,
};

const DEFAULT_MODULES_MAP: ModulesMap = {
  [MODULE_TYPE.UI]: [],
  [MODULE_TYPE.JS]: [],
  [MODULE_TYPE.QUERY]: [],
};

export function groupModules({ modules }: GroupModulesProps) {
  const modulesInArray = Object.values(modules);
  const modulesMap = klona(DEFAULT_MODULES_MAP);

  const sortedExtendedModules = sortBy(modules, ["name"]);
  const modulesGroupedByType = groupBy(
    sortedExtendedModules,
    ({ type }) => type,
  );

  Object.entries(modulesGroupedByType).forEach(([moduleType, modules]) => {
    const handler = handlers[moduleType as MODULE_TYPE];

    if (handler) {
      modulesMap[moduleType as MODULE_TYPE] = handler({ modules });
    }
  });

  return { modulesMap, modulesCount: modulesInArray.length };
}
