import React, { useCallback, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_EDIT_NAME,
  CONTEXT_SHOW_BINDING,
  createMessage,
  CONTEXT_COPY,
  CONTEXT_MOVE,
  CONTEXT_NO_PAGE,
} from "@appsmith/constants/messages";

import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import {
  copyModuleInstanceRequest,
  deleteModuleInstance,
  moveModuleInstanceRequest,
} from "@appsmith/actions/moduleInstanceActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { noop } from "lodash";
import { FilesContext } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { getPageListAsOptions } from "@appsmith/selectors/entitiesSelector";
import {
  ModuleInstanceCreatorType,
  type ModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";

interface EntityContextMenuProps {
  className?: string;
  pageId: string;
  canManage?: boolean;
  canDelete?: boolean;
  moduleInstance: ModuleInstance;
}
export function ModuleInstanceEntityContextMenu(props: EntityContextMenuProps) {
  // Import the context
  const context = useContext(FilesContext);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuPages = useSelector(getPageListAsOptions);
  const dispatch = useDispatch();
  const { parentEntityId } = context;
  const { canDelete = false, canManage = false, moduleInstance } = props;

  const showBinding = useCallback(
    (id, name) =>
      dispatch({
        type: ReduxActionTypes.SET_ENTITY_INFO,
        payload: {
          entityId: id,
          entityName: name,
          entityType: ENTITY_TYPE.MODULE_INSTANCE,
          show: true,
        },
      }),
    [],
  );

  const copyModuleInstanceToPage = useCallback(
    (moduleInstance: ModuleInstance, destinationContextId: string) =>
      dispatch(
        copyModuleInstanceRequest({
          destinationContextId,
          destinationContextType: ModuleInstanceCreatorType.PAGE,
          name: moduleInstance.name,
          sourceModuleInstanceId: moduleInstance.id,
        }),
      ),
    [dispatch],
  );

  const moveModuleInstanceToPage = useCallback(
    (moduleInstance: ModuleInstance, destinationContextId: string) =>
      dispatch(
        moveModuleInstanceRequest({
          destinationContextId,
          destinationContextType: ModuleInstanceCreatorType.PAGE,
          name: moduleInstance.name,
          sourceModuleInstanceId: moduleInstance.id,
        }),
      ),
    [dispatch],
  );

  const deleteModuleInstanceFromPage = (id: string, type: MODULE_TYPE) => {
    dispatch(deleteModuleInstance({ id, type }));
  };

  const editModuleInstanceName = useCallback(() => {
    dispatch(initExplorerEntityNameEdit(moduleInstance.id));
  }, [dispatch, moduleInstance.id]);

  const optionsTree = [
    canManage && {
      value: "rename",
      onSelect: editModuleInstanceName,
      label: createMessage(CONTEXT_EDIT_NAME),
    },
    {
      value: "showBinding",
      onSelect: () => showBinding(moduleInstance.id, moduleInstance.name),
      label: createMessage(CONTEXT_SHOW_BINDING),
    },
    canManage && {
      value: "copy",
      onSelect: noop,
      label: createMessage(CONTEXT_COPY),
      children: menuPages.map((page) => {
        return {
          ...page,
          onSelect: () => copyModuleInstanceToPage(moduleInstance, page.id),
        };
      }),
    },
    canManage && {
      value: "move",
      onSelect: noop,
      label: createMessage(CONTEXT_MOVE),
      children:
        menuPages.length > 1
          ? menuPages
              .filter((page) => page.id !== parentEntityId) // Remove current page from the list
              .map((page) => {
                return {
                  ...page,
                  onSelect: () =>
                    moveModuleInstanceToPage(moduleInstance, page.id),
                };
              })
          : [
              {
                value: "No Pages",
                onSelect: noop,
                label: createMessage(CONTEXT_NO_PAGE),
              },
            ],
    },
    canDelete && {
      confirmDelete: confirmDelete,
      className: "t--apiFormDeleteBtn single-select",
      value: "delete",
      onSelect: () => {
        confirmDelete
          ? deleteModuleInstanceFromPage(moduleInstance.id, moduleInstance.type)
          : setConfirmDelete(true);
      },
      label: confirmDelete
        ? createMessage(CONFIRM_CONTEXT_DELETE)
        : createMessage(CONTEXT_DELETE),
      intent: "danger",
    },
  ].filter(Boolean);

  return optionsTree.length > 0 ? (
    <ContextMenu
      className={props.className}
      optionTree={optionsTree as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
    />
  ) : null;
}

export default ModuleInstanceEntityContextMenu;
