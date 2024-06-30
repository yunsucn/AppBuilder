export * from "ce/sagas/helpers";
import type { ResolveParentEntityMetadataReturnType } from "ce/sagas/helpers";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import { resolveParentEntityMetadata as CE_resolveParentEntityMetadata } from "ce/sagas/helpers";
import type { Action } from "entities/Action";
import type { Log } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "@appsmith/entities/AppsmithConsole/utils";
import type {
  ModuleInstanceAction,
  ModuleInstanceJSCollection,
} from "@appsmith/reducers/entityReducers/moduleInstanceEntitiesReducer";
import { select } from "redux-saga/effects";
import {
  getModuleInstanceActionById,
  getModuleInstanceJSCollectionById,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { klona } from "klona";
import type { DeleteErrorLogPayload } from "actions/debuggerActions";

export const resolveParentEntityMetadata = (
  action: Partial<Action>,
): ResolveParentEntityMetadataReturnType => {
  const result = CE_resolveParentEntityMetadata(action);

  if (result.parentEntityId) return result;

  if (action.moduleId) {
    return {
      parentEntityId: action.moduleId,
      parentEntityKey: CreateNewActionKey.MODULE,
    };
  }

  if (action.workflowId) {
    return {
      parentEntityId: action.workflowId,
      parentEntityKey: CreateNewActionKey.WORKFLOW,
    };
  }

  return { parentEntityId: undefined, parentEntityKey: undefined };
};

export function* transformAddErrorLogsSaga(logs: Log[]) {
  const transformedLogs: Log[] = klona(logs);
  for (const log of transformedLogs) {
    const { id = "", source } = log;

    if (source?.type === ENTITY_TYPE.ACTION) {
      const instanceAction: ModuleInstanceAction | undefined = yield select(
        getModuleInstanceActionById,
        id,
      );
      const { moduleInstanceId = "" } = instanceAction || {};
      const moduleInstance: ModuleInstance | undefined = yield select(
        getModuleInstanceById,
        moduleInstanceId,
      );

      if (moduleInstance) {
        log.id = moduleInstanceId;
        if (log.source) {
          log.source.id = moduleInstance.id;
          log.source.type = ENTITY_TYPE.MODULE_INSTANCE;
          log.source.name = moduleInstance.name;
        }
      }
    }

    if (source?.type === ENTITY_TYPE.JSACTION) {
      const instanceJSCollection: ModuleInstanceJSCollection | undefined =
        yield select(getModuleInstanceJSCollectionById, source?.id || "");

      const { moduleInstanceId = "" } = instanceJSCollection || {};
      const moduleInstance: ModuleInstance | undefined = yield select(
        getModuleInstanceById,
        moduleInstanceId,
      );

      if (moduleInstance) {
        if (log.source) {
          log.source.id = moduleInstance.id;
          log.source.type = ENTITY_TYPE.MODULE_INSTANCE;
          log.source.name = moduleInstance.name;
        }
      }
    }
  }

  return transformedLogs;
}

export function* transformDeleteErrorLogsSaga(payload: DeleteErrorLogPayload) {
  const transformedPayload = klona(payload);

  for (const item of transformedPayload) {
    const { id } = item;

    const instanceAction: ModuleInstanceAction | undefined = yield select(
      getModuleInstanceActionById,
      id,
    );
    const instanceJSCollection: ModuleInstanceJSCollection | undefined =
      yield select(getModuleInstanceJSCollectionById, id || "");

    const moduleInstanceId =
      instanceAction?.moduleInstanceId ||
      instanceJSCollection?.moduleInstanceId;

    if (moduleInstanceId) {
      item.id = moduleInstanceId;
    }
  }

  return transformedPayload;
}
