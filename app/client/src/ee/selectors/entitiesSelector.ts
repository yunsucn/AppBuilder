export * from "ce/selectors/entitiesSelector";
import { createSelector } from "reselect";
import type { NewEntityNameOptions } from "ce/selectors/entitiesSelector";
import {
  getAction as CE_getAction,
  getActionData as CE_getActionData,
  getActions,
  getCurrentJSCollections,
  getJSCollections,
  getJSSegmentItems as CE_getJSSegmentItems,
  getQuerySegmentItems as CE_getQuerySegmentItems,
  selectDatasourceIdToNameMap,
  selectFilesForExplorer as CE_selectFilesForExplorer,
  GROUP_TYPES,
  getPluginImages,
} from "ce/selectors/entitiesSelector";
import { type Module, MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import {
  getAllModules,
  getCurrentModuleId,
  getModuleInstanceActions,
  getModuleInstanceJSCollections,
} from "@appsmith/selectors/modulesSelector";
import type { AppState } from "@appsmith/reducers";
import { find, sortBy } from "lodash";
import { getAllModuleInstances } from "./moduleInstanceSelectors";
import { getPackages } from "./packageSelectors";
import type {
  ExplorerFileEntity,
  ExplorerFileEntityForModule,
} from "@appsmith/pages/Editor/Explorer/helpers";
import {
  convertModulesToArray,
  getModuleIdPackageNameMap,
} from "@appsmith/utils/Packages/moduleHelpers";
import type { ActionResponse } from "api/ActionAPI";
import { type Action, PluginType } from "entities/Action";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import {
  isEmbeddedAIDataSource,
  isEmbeddedRestDatasource,
} from "entities/Datasource";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  getCurrentWorkflowJSActions,
  getIsCurrentEditorWorkflowType,
} from "./workflowSelectors";
import {
  ActionUrlIcon,
  DefaultModuleIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import type { ModuleInstanceEntitiesReducerState } from "@appsmith/reducers/entityReducers/moduleInstanceEntitiesReducer";
import type {
  ModuleInstance,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import type { JSCollection } from "entities/JSCollection";

export const getCurrentModule = createSelector(
  getAllModules,
  getCurrentModuleId,
  (modules, currentModuleId) => {
    return modules[currentModuleId];
  },
);

export const getInputsForModule = (state: AppState): Module["inputsForm"] => {
  const moduleId = getCurrentModuleId(state);
  const module = state.entities.modules[moduleId];
  return module?.inputsForm || [];
};

/**
 * Note: This method is to used ONLY for evaluation purpose.
 * To get module actions use getModulePublicAction in modulesSelector.ts
 *  */
export const getCurrentModuleActions = createSelector(
  getCurrentModuleId,
  getActions,
  getModuleInstanceActions,
  (currentModuleId, actions, moduleInstanceActions) => {
    if (currentModuleId) return [...actions, ...moduleInstanceActions];
    return moduleInstanceActions || [];
  },
);

/**
 * Note: This method is to used ONLY for evaluation purpose.
 * To get module actions use getModulePublicJSCollection in modulesSelector.ts
 *  */
export const getCurrentModuleJSCollections = createSelector(
  getCurrentModuleId,
  getJSCollections,
  getModuleInstanceJSCollections,
  (currentModuleId, moduleJSCollections, moduleInstanceJSCollections) => {
    if (currentModuleId)
      return [...moduleJSCollections, ...moduleInstanceJSCollections];
    return moduleInstanceJSCollections || [];
  },
);

/**
 * Note: This method is to used ONLY for evaluation purpose.
 * To get module actions create a similar selector in moduleInstanceSelectors.ts if it does
 * not exist.
 *  */
export const getModuleInstanceEntities = (
  state: AppState,
): ModuleInstanceEntitiesReducerState => state.entities.moduleInstanceEntities;

/**
 * Note: This method is to used ONLY for evaluation purpose.
 * To get module actions use getAllModuleInstances in moduleInstanceSelectors.ts
 *  */
export const getModuleInstances = createSelector(
  getAllModuleInstances,
  getModuleInstanceEntities,
  (moduleInstances, moduleInstanceEntities) => {
    const privateModuleInstances =
      moduleInstanceEntities.moduleInstances.reduce(
        (acc, moduleInstance) => {
          acc[moduleInstance.id] = moduleInstance;
          return acc;
        },
        {} as Record<ModuleInstanceId, ModuleInstance>,
      );

    return {
      ...moduleInstances,
      ...privateModuleInstances,
    };
  },
);

export const selectFilesForExplorer = createSelector(
  CE_selectFilesForExplorer,
  getAllModuleInstances,
  getAllModules,
  getPackages,
  getIsCurrentEditorWorkflowType,
  (
    CE_files,
    moduleInstances = {},
    modules = {},
    packages = {},
    isCurrenEditorWorkflows = false,
  ) => {
    const modulesArray = convertModulesToArray(modules);
    const modulePackageMap = getModuleIdPackageNameMap(modulesArray, packages);
    const moduleInstanceFiles = Object.values(moduleInstances).reduce(
      (acc, file) => {
        const group =
          modulePackageMap[file.sourceModuleId] || GROUP_TYPES.PACKAGES;
        acc = acc.concat({
          type: "moduleInstance",
          entity: file,
          group,
        });
        return acc;
      },
      [] as Array<ExplorerFileEntityForModule>,
    );

    const filteredCEFiles = CE_files.filter(
      (file: any) => file.type !== "group",
    );

    // if current editor is jsObject, then the files with group name as "JS Objects" should be shown at the top
    // followed by sorting by group name and then by file name
    const filesSortedByGroupName = sortBy(
      [...filteredCEFiles, ...moduleInstanceFiles],
      [
        (file) =>
          isCurrenEditorWorkflows && file.group === GROUP_TYPES.JS_ACTIONS
            ? 0
            : 1,
        (file) => file.group?.toLowerCase(),
        (file: any) => file.entity?.name?.toLowerCase(),
      ],
    );

    const groupedFiles = filesSortedByGroupName.reduce(
      (acc, file) => {
        if (acc.group !== file.group) {
          acc.files = acc.files.concat({
            type: "group",
            entity: {
              name: file.group,
            },
          });
          acc.group = file.group;
        }
        acc.files = acc.files.concat({
          ...file,
          entity: {
            id: file.entity?.id,
            name: file.entity?.name,
            isMainJSCollection: file.entity?.config?.isMainJSCollection,
          },
        });
        return acc;
      },
      {
        group: "" as any,
        files: [] as any,
      },
    );

    return groupedFiles.files;
  },
);

export const getQuerySegmentItems = createSelector(
  CE_getQuerySegmentItems,
  getAllModuleInstances,
  getAllModules,
  getPackages,
  getPluginImages,
  (items, moduleInstances, modules, packages, pluginImages) => {
    const modulesArray = convertModulesToArray(modules);
    const modulePackageMap = getModuleIdPackageNameMap(modulesArray, packages);
    const itemsWithQueryModules = items.map((item) => {
      if (item.type === PluginType.INTERNAL) {
        // TODO: Add a group for internal actions, currently only Workflow actions are internal
        return {
          ...item,
          group: "Workflows",
        };
      }
      return item;
    });
    Object.values(moduleInstances).forEach((instance) => {
      if (instance.type === MODULE_TYPE.QUERY) {
        const module = modulesArray.find(
          (m) => m.id === instance.sourceModuleId,
        );
        const iconUrl = module ? pluginImages[module?.pluginId || ""] : "";

        itemsWithQueryModules.push({
          isModuleInstance: true,
          key: instance.id,
          title: instance.name,
          group: modulePackageMap[instance.sourceModuleId] || "Packages",
          type: PluginType.DB,
          icon: iconUrl ? ActionUrlIcon(iconUrl) : DefaultModuleIcon(),
        });
      }
    });
    return itemsWithQueryModules;
  },
);

export const getJSSegmentItems = createSelector(
  CE_getJSSegmentItems,
  getAllModuleInstances,
  getAllModules,
  getPackages,
  (items, moduleInstances, modules, packages) => {
    const modulesArray = convertModulesToArray(modules);
    const modulePackageMap = getModuleIdPackageNameMap(modulesArray, packages);
    const itemsWithJSModules = [...items];
    Object.values(moduleInstances).forEach((instance) => {
      if (instance.type === MODULE_TYPE.JS) {
        const module = modulesArray.find(
          (m) => m.id === instance.sourceModuleId,
        );
        itemsWithJSModules.push({
          key: instance.id,
          isModuleInstance: true,
          title: instance.name,
          group: modulePackageMap[instance.sourceModuleId] || "Packages",
          type: PluginType.JS,
          icon: module ? JsFileIconV2() : DefaultModuleIcon(),
        });
      }
    });
    return itemsWithJSModules;
  },
);

export const getAction = (
  state: AppState,
  actionId: string,
): Action | undefined => {
  const action = CE_getAction(state, actionId);
  if (action) return action;
  const moduleInstanceAction = find(
    getModuleInstanceEntities(state).actions,
    (a) => a.config.id === actionId,
  );
  if (moduleInstanceAction) return moduleInstanceAction.config;
};

export const getActionData = (
  state: AppState,
  actionId: string,
): ActionResponse | undefined => {
  const actionData = CE_getActionData(state, actionId);
  if (actionData) return actionData;
  const moduleInstanceAction = find(
    getModuleInstanceEntities(state).actions,
    (a) => a.config.id === actionId,
  );
  if (moduleInstanceAction) return moduleInstanceAction.data;
};

export const getQueryModuleInstances = createSelector(
  getModuleInstances,
  getModuleInstanceEntities,
  (moduleInstances, moduleInstanceEntities) => {
    const queryModuleInstances = Object.values(moduleInstances).map(
      (instance) => {
        if (instance.type === MODULE_TYPE.QUERY) {
          const getPublicAction = moduleInstanceEntities.actions.find(
            (entity: ActionData) =>
              entity.config.moduleInstanceId === instance.id,
          );
          return {
            config: instance,
            data: getPublicAction?.data,
          };
        }
      },
    );
    return queryModuleInstances.filter((instance) => !!instance);
  },
);

export const getJSModuleInstancesData = createSelector(
  getModuleInstances,
  getModuleInstanceEntities,
  (moduleInstances, moduleInstanceEntities) => {
    const JSModuleInstances = Object.values(moduleInstances).map((instance) => {
      if (instance.type === MODULE_TYPE.JS) {
        const getPublicAction = moduleInstanceEntities.jsCollections.find(
          (entity) => entity.config.moduleInstanceId === instance.id,
        );

        return {
          config: getPublicAction?.config as JSCollection,
          data: getPublicAction?.data,
          name: instance.name,
        };
      }
    });
    return JSModuleInstances.filter((instance) => !!instance);
  },
);

/**
 *
 * getJSCollectionFromAllEntities is used to get the js collection from all jsAction entities (including module instance entities) )
 */
export const getJSCollectionFromAllEntities = (
  state: AppState,
  actionId: string,
) => {
  const jsaction = find(
    [
      ...state.entities.jsActions,
      ...state.entities.moduleInstanceEntities.jsCollections,
    ],
    (a) => a.config.id === actionId,
  );
  return jsaction && jsaction.config;
};

export const getAllJSCollections = createSelector(
  getCurrentJSCollections,
  getCurrentModuleJSCollections,
  getCurrentWorkflowJSActions,
  (
    currentContextJSCollections,
    moduleInstanceJSCollections,
    workflowJsCollections,
  ) => {
    return [
      ...moduleInstanceJSCollections,
      ...currentContextJSCollections,
      ...workflowJsCollections,
    ];
  },
);

/**
 * Checking for action.config.datasource as well as there is a case in action execution that
 * if an action is successfully executed but in the reducer the action is not found, the result
 * is stored in the reducer along with just the id. In that case apart from id every other information
 * is missing. This condition makes sure that important attributes are present to qualify for a valid
 * private entity action
 */
export const getPrivateActions = createSelector(getActions, (actions) =>
  actions.filter(
    (action) => !action.config.isPublic && action.config.datasource,
  ),
);

export const selectFilesForPackageExplorer = createSelector(
  getPrivateActions,
  getJSCollections,
  selectDatasourceIdToNameMap,
  (actions, jsActions, datasourceIdToNameMap) => {
    const files = [...actions, ...jsActions].reduce((acc, file) => {
      let group = "";
      if (file.config.pluginType === PluginType.JS) {
        group = GROUP_TYPES.JS_ACTIONS;
      } else if (file.config.pluginType === PluginType.API) {
        group = isEmbeddedRestDatasource(file.config.datasource)
          ? GROUP_TYPES.API
          : datasourceIdToNameMap[file.config.datasource.id] ?? GROUP_TYPES.API;
      } else if (file.config.pluginType === PluginType.AI) {
        group = isEmbeddedAIDataSource(file.config.datasource)
          ? GROUP_TYPES.AI
          : datasourceIdToNameMap[file.config.datasource.id] ?? GROUP_TYPES.AI;
      } else {
        group = datasourceIdToNameMap[file.config.datasource.id];
      }
      acc = acc.concat({
        type: file.config.pluginType,
        entity: file,
        group,
      });
      return acc;
    }, [] as Array<ExplorerFileEntity>);

    const filesSortedByGroupName = sortBy(files, [
      (file) => file.group?.toLowerCase(),
      (file) => file.entity.config?.name?.toLowerCase(),
    ]);
    const groupedFiles = filesSortedByGroupName.reduce(
      (acc, file) => {
        if (acc.group !== file.group) {
          acc.files = acc.files.concat({
            type: "group",
            entity: {
              name: file.group,
            },
          });
          acc.group = file.group;
        }
        acc.files = acc.files.concat({
          ...file,
          entity: {
            id: file.entity.config.id,
            name: file.entity.config.name,
            isMainJSCollection: file.entity?.config?.isMainJSCollection,
          },
        });
        return acc;
      },
      {
        group: "" as any,
        files: [] as any,
      },
    );
    return groupedFiles.files;
  },
);

export const getIsActionConverting = (state: AppState, actionId: string) => {
  const action = state.entities.actions.find((a) => a.config.id === actionId);

  return action?.isConverting || false;
};

export const getNewEntityName = createSelector(
  getActions,
  getJSCollections,
  getModuleInstances,
  (_state: AppState, options: NewEntityNameOptions) => options,
  (actions, jsCollections, moduleInstances = {}, options) => {
    const {
      parentEntityId,
      parentEntityKey,
      prefix,
      startWithoutIndex = false,
      suffix = "",
    } = options;
    const actionNames = actions
      .filter((a) => a.config[parentEntityKey] === parentEntityId)
      .map((a) => a.config.name);
    const jsActionsNames = jsCollections
      .filter((a) => a.config[parentEntityKey] === parentEntityId)
      .map((a) => a.config.name);

    const moduleInstanceNames = Object.values(moduleInstances)
      .filter((mi) => mi.contextId === parentEntityId)
      .map((mi) => mi.name);

    const entityNames = actionNames
      .concat(jsActionsNames)
      .concat(moduleInstanceNames);

    const prefixExists = entityNames.indexOf(`${prefix}`) > -1;

    return getNextEntityName(
      prefixExists ? `${prefix}${suffix}` : prefix,
      entityNames,
      startWithoutIndex,
    );
  },
);
