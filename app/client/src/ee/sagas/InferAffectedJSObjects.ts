export * from "ce/sagas/InferAffectedJSObjects";
import type {
  ConvertEntityToInstanceResponse,
  CreateModuleInstanceResponse,
} from "@appsmith/api/ModuleInstanceApi";
import { MODULE_INSTANCE_ACTIONS } from "@appsmith/actions/evaluationActionsList";
import type {
  BufferedReduxAction,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { get } from "lodash";
import type { JSCollection } from "entities/JSCollection";
import { AFFECTED_JS_OBJECTS_FNS as CE_AFFECTED_JS_OBJECTS_FNS } from "ce/sagas/InferAffectedJSObjects";
export function getAffectedJSObjectIdsFromModuleActions(
  action: ReduxAction<unknown> | BufferedReduxAction<unknown>,
) {
  if (
    action.type === ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS ||
    action.type === ReduxActionTypes.FETCH_ALL_MODULE_ENTITY_COMPLETION
  ) {
    return {
      ids: [],
      isAllAffected: true,
    };
  }
  if (!MODULE_INSTANCE_ACTIONS.includes(action.type)) {
    return {
      ids: [],
      isAllAffected: false,
    };
  }
  // For module instance actions infer affected JSObjects from the action
  if (action.type === ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS) {
    return {
      ids: [],
      isAllAffected: true,
    };
  }

  action as ReduxAction<
    ConvertEntityToInstanceResponse | CreateModuleInstanceResponse
  >;

  const extractJSCollection =
    get(action, "payload.entities.jsCollections") ||
    get(action, "payload.moduleInstanceData.entities.jsCollections");

  const extractedJSCollectionIds = Array.isArray(extractJSCollection)
    ? (extractJSCollection as JSCollection[]).map(({ id }) => id)
    : [];

  return {
    ids: extractedJSCollectionIds,
    isAllAffected: false,
  };
}

export const AFFECTED_JS_OBJECTS_FNS = [
  ...CE_AFFECTED_JS_OBJECTS_FNS,
  getAffectedJSObjectIdsFromModuleActions,
];
