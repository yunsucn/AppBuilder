import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type {
  ModuleInstance,
  ModuleInstanceId,
  QueryModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";
import type {
  ConvertEntityToInstanceResponse,
  CreateModuleInstanceResponse,
  UpdateModuleInstanceStaleStatusPayload,
} from "@appsmith/api/ModuleInstanceApi";
import { klona } from "klona";
import type { DummyModuleInstanceResponse } from "@appsmith/actions/moduleInstanceActions";

export type ModuleInstanceReducerState = Record<
  ModuleInstanceId,
  ModuleInstance
>;

const initialState: ModuleInstanceReducerState = {};

interface AddModuleReferenceByNameSuccessPayload {
  names: string[];
  updatedInstanceStaleStatus: UpdateModuleInstanceStaleStatusPayload;
}

const updateInstanceStaleStatus = (
  draftState: ModuleInstanceReducerState,
  action: ReduxAction<AddModuleReferenceByNameSuccessPayload>,
) => {
  const { updatedInstanceStaleStatus } = action.payload;
  updatedInstanceStaleStatus.forEach(({ isStale, moduleInstanceId }) => {
    if (draftState[moduleInstanceId]) {
      draftState[moduleInstanceId].isStale = isStale;
    }
  });

  return draftState;
};

export const handlers = {
  [ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<CreateModuleInstanceResponse>,
  ) => {
    const { moduleInstance } = action.payload;
    const { sourceModuleId } = moduleInstance;
    const dummyModuleInstance = Object.values(draftState).find(
      (mi) => mi.sourceModuleId === sourceModuleId && mi.isDummy,
    );

    if (dummyModuleInstance) {
      delete draftState[dummyModuleInstance.id];
    }

    draftState[moduleInstance.id] = moduleInstance;
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<QueryModuleInstance>,
  ) => {
    draftState[action.payload.id] = action.payload;
    return draftState;
  },

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<QueryModuleInstance>,
  ) => {
    delete draftState[action.payload.id];
    return draftState;
  },

  [ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<QueryModuleInstance[]>,
  ) => {
    draftState = klona(initialState);
    const moduleInstances = action.payload;

    moduleInstances.forEach((moduleInstance: QueryModuleInstance) => {
      draftState[moduleInstance.id] = moduleInstance;
    });

    return draftState;
  },

  [ReduxActionTypes.GENERATE_DUMMY_MODULE_INSTANCES_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<DummyModuleInstanceResponse>,
  ) => {
    const { dummyModuleInstances } = action.payload;

    dummyModuleInstances.forEach((moduleInstance) => {
      draftState[moduleInstance.id] = moduleInstance;
    });
  },

  [ReduxActionTypes.GENERATE_DUMMY_MODULE_INSTANCES_INIT]: (
    draftState: ModuleInstanceReducerState,
  ) => {
    const dummyModuleInstanceIds = Object.values(draftState).map((mi) => {
      return mi.isDummy ? mi.id : null;
    });

    dummyModuleInstanceIds.forEach((id) => {
      if (id) {
        delete draftState[id];
      }
    });
  },

  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<{
      id: ModuleInstanceId;
      newName: string;
    }>,
  ) => {
    const { id, newName } = action.payload;

    draftState[id].name = newName;

    return draftState;
  },

  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },

  [ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<ConvertEntityToInstanceResponse>,
  ) => {
    const { moduleInstanceData: { moduleInstance } = {} } = action.payload;

    if (moduleInstance) {
      draftState[moduleInstance.id] = moduleInstance;
    }
  },

  [ReduxActionTypes.COPY_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<CreateModuleInstanceResponse>,
  ) => {
    const { moduleInstance } = action.payload;
    draftState[moduleInstance.id] = moduleInstance;
    return draftState;
  },

  [ReduxActionTypes.ADD_MODULE_REFERENCE_BY_NAME_SUCCESS]:
    updateInstanceStaleStatus,
  [ReduxActionTypes.REMOVE_MODULE_REFERENCE_BY_NAME_SUCCESS]:
    updateInstanceStaleStatus,
};

const moduleInstanceReducer = createImmerReducer(initialState, handlers);

export default moduleInstanceReducer;
