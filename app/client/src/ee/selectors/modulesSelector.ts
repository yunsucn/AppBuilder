export * from "ce/selectors/modulesSelector";
import type { AppState } from "@appsmith/reducers";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { Action } from "entities/Action";
import { createSelector } from "reselect";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import { countBy } from "lodash";

const DEFAULT_INPUT_EVAL_VALUES = {};

/**
 * This is a duplicated selector from entitiesSelector and the reason for
 * duplication is the entitiesSelector is referencing the modulesSelector and
 * if the getDatasources is referenced from entitiesSelect, a cyclic dependency is
 * created. This has to be resolved more gracefully.
 *
 * Since appropriate typings are in place, if the structure changes then we would get typing error here.
 *  */
export const getDatasources = (state: AppState) => {
  return state.entities.datasources.list;
};

export const getAllModules = (state: AppState) => state.entities.modules;

export const getCurrentModuleId = (state: AppState) =>
  state.ui.editor.currentModuleId || "";

export const getCurrentModule = createSelector(
  getAllModules,
  getCurrentModuleId,
  (modules, moduleId) => modules[moduleId],
);

export const getModulePermissions = (state: AppState) => {
  const moduleId = getCurrentModuleId(state);
  const module = state.entities.modules[moduleId];

  return module?.userPermissions || [];
};

export const getModuleById = (
  state: AppState,
  moduleId: string,
): Module | undefined => state.entities.modules[moduleId];

export const getIsModuleFetchingEntities = (state: AppState) =>
  state.ui.editor.isModuleFetchingEntities;

export const getModulePublicAction = (
  state: AppState,
  moduleId: string,
): Action | undefined => {
  const action = state.entities.actions.find(
    (action) => action.config.moduleId === moduleId && action.config.isPublic,
  );

  return action ? action.config : undefined;
};

export const getModulePublicJSCollection = (
  state: AppState,
  moduleId: string,
) => {
  const action = state.entities.jsActions.find(
    (action) => action.config.moduleId === moduleId && action.config.isPublic,
  );

  return action ? action.config : undefined;
};

export const getIsModuleSaving = (state: AppState) => {
  return state.ui.editor.isModuleUpdating;
};

export const getModuleInputsEvalValues = (state: AppState) =>
  state.evaluations.tree?.inputs || DEFAULT_INPUT_EVAL_VALUES;

export const getModuleInstanceActions = (state: AppState) =>
  state.entities.moduleInstanceEntities.actions;

export const getModuleInstanceJSCollections = (
  state: AppState,
): JSCollectionData[] => state.entities.moduleInstanceEntities.jsCollections;

export const getModuleDSUsage = createSelector(
  getAllModules,
  getDatasources,
  (state: AppState, editorType: string) => editorType,
  (modules, datasources, editorType) => {
    const actionCount = countBy(Object.values(modules), "datasourceId");
    const actionDsMap: Record<string, string> = {};

    datasources.forEach((ds) => {
      actionDsMap[ds.id] = `No modules in this ${editorType}`;
    });
    Object.keys(actionCount).forEach((dsId) => {
      actionDsMap[dsId] = `${actionCount[dsId]} modules in this ${editorType}`;
    });

    return actionDsMap;
  },
);

export const getCurrentProcessingAddModuleReference = (state: AppState) =>
  state.ui.editor.currentProcessingAddModuleReference;

export const getCurrentProcessingRemoveModuleReference = (state: AppState) =>
  state.ui.editor.currentProcessingRemoveModuleReference;
