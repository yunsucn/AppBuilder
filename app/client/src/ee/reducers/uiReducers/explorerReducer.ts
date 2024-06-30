export * from "ce/reducers/uiReducers/explorerReducer";
import type { DeleteModulePayload } from "@appsmith/actions/moduleActions";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";
import type { FetchPackageResponse } from "@appsmith/api/PackageApi";
import type { ModuleMetadata } from "@appsmith/constants/ModuleConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ExplorerReduxState as CE_ExplorerReduxState } from "ce/reducers/uiReducers/explorerReducer";
import {
  initialState as CE_initialState,
  handlers as CE_handlers,
  setUpdatingEntity,
  setEntityUpdateError,
  setEntityUpdateSuccess,
} from "ce/reducers/uiReducers/explorerReducer";
import { createImmerReducer } from "utils/ReducerUtils";

export interface ExplorerReduxState extends CE_ExplorerReduxState {
  modulesMetadata: Record<string, ModuleMetadata>;
}

export const initialState = {
  ...CE_initialState,
  modulesMetadata: {},
};

export const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.DELETE_MODULE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_MODULE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_MODULE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_MODULE_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_MODULE_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_MODULE_INSTANCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_MODULE_INSTANCE_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.MOVE_MODULE_INSTANCE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.MOVE_MODULE_INSTANCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.MOVE_MODULE_INSTANCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.COPY_MODULE_INSTANCE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.COPY_MODULE_INSTANCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.COPY_MODULE_INSTANCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_ACTION_NAME_FOR_PACKAGE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_ACTION_NAME_FOR_PACKAGE_ERROR]:
    setEntityUpdateError,
  [ReduxActionTypes.SAVE_ACTION_NAME_FOR_PACKAGE_SUCCESS]:
    setEntityUpdateSuccess,

  [ReduxActionTypes.FETCH_PACKAGE_SUCCESS]: (
    draftState: ExplorerReduxState,
    action: ReduxAction<FetchPackageResponse>,
  ) => {
    const { modulesMetadata } = action.payload;
    modulesMetadata.forEach((moduleMetadata) => {
      draftState.modulesMetadata[moduleMetadata.moduleId] = moduleMetadata;
    });

    return draftState;
  },

  [ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS]: (
    draftState: ExplorerReduxState,
    action: ReduxAction<FetchModuleEntitiesResponse>,
  ) => {
    const { actions, jsCollections } = action.payload;
    [...jsCollections, ...actions].forEach((entity) => {
      if (
        entity.moduleId &&
        entity.isPublic &&
        !draftState.modulesMetadata[entity.moduleId]
      ) {
        draftState.modulesMetadata[entity.moduleId] = {
          moduleId: entity.moduleId,
          datasourceId: "datasource" in entity ? entity.datasource.id : "",
          pluginId: entity.pluginId,
          pluginType: entity.pluginType,
          publicEntity: entity,
        };
      }
    });

    return draftState;
  },
  [ReduxActionTypes.DELETE_MODULE_SUCCESS]: (
    draftState: ExplorerReduxState,
    action: ReduxAction<DeleteModulePayload>,
  ) => {
    const { id: moduleId } = action.payload;
    delete draftState.modulesMetadata[moduleId];
  },
};

/**
 * Context Reducer to store states of different components of editor
 */
const editorContextReducer = createImmerReducer(initialState, handlers);

export default editorContextReducer;
