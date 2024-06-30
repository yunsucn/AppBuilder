import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type {
  FetchPackageResponse,
  FetchConsumablePackagesInWorkspaceResponse,
} from "@appsmith/api/PackageApi";
import type {
  DeleteModulePayload,
  UpdateModuleInputsPayload,
} from "@appsmith/actions/moduleActions";
import { klona } from "klona";
import type { ConvertEntityToInstanceResponse } from "@appsmith/api/ModuleInstanceApi";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";
import type { Action } from "entities/Action";
import { pick } from "lodash";

type ID = string;

export type ModulesReducerState = Record<ID, Module>;

export const initialState: ModulesReducerState = {};

const modulesReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_PACKAGE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<FetchPackageResponse>,
  ) => {
    draftState = klona(initialState);

    const { modules, modulesMetadata } = action.payload;

    modules.forEach((module: Module) => {
      const metadata = modulesMetadata.find(
        (data) => data.moduleId === module.id,
      )!;

      draftState[module.id] = {
        ...module,
        ...pick(metadata, ["datasourceId", "pluginId", "pluginType"]),
      };
    });

    return draftState;
  },
  [ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<FetchModuleEntitiesResponse>,
  ) => {
    const { actions } = action.payload;
    actions.forEach((action) => {
      if (
        action.moduleId &&
        action.isPublic &&
        !draftState[action.moduleId].pluginId
      ) {
        draftState[action.moduleId] = {
          ...draftState[action.moduleId],
          datasourceId: action.datasource.id,
          pluginId: action.pluginId,
          pluginType: action.pluginType,
        };
      }
    });

    return draftState;
  },
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.DELETE_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<DeleteModulePayload>,
  ) => {
    const { id: moduleId } = action.payload;
    delete draftState[moduleId];

    return draftState;
  },
  [ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.CREATE_JS_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.UPDATE_MODULE_INPUTS_INIT]: (
    draftState: ModulesReducerState,
    action: ReduxAction<UpdateModuleInputsPayload>,
  ) => {
    const { id, inputsForm } = action.payload;
    draftState[id].inputsForm = inputsForm;

    return draftState;
  },
  [ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<FetchConsumablePackagesInWorkspaceResponse>,
  ) => {
    draftState = klona(initialState);
    const { moduleMetadata, modules } = action.payload;

    modules.forEach((module: Module) => {
      const metadata = moduleMetadata.filter(
        (data) => data.moduleId === module.id,
      )[0];

      draftState[module.id] = {
        ...module,
        ...metadata,
      };
    });
    return draftState;
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },

  [ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<ConvertEntityToInstanceResponse>,
  ) => {
    const { module } = action.payload;
    draftState[module.id] = module;
  },

  // When the datasource of a public action is modified then
  // the new datasource id is updated in module.
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<{ data: Action }>,
  ) => {
    const moduleAction = action.payload.data;
    if (moduleAction.moduleId && moduleAction.isPublic) {
      draftState[moduleAction.moduleId].datasourceId =
        moduleAction.datasource.id;
    }
  },
});

export default modulesReducer;
