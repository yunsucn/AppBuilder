import React, { useCallback, useState } from "react";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "design-system";
import { useToggle } from "@mantine/hooks";

import {
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONTEXT_MOVE,
  createMessage,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  copyModuleInstanceRequest,
  deleteModuleInstance,
  moveModuleInstanceRequest,
} from "@appsmith/actions/moduleInstanceActions";
import {
  ModuleInstanceCreatorType,
  type ModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";
import {
  hasDeleteModuleInstancePermission,
  hasManageModuleInstancePermission,
} from "@appsmith/utils/permissionHelpers";

interface EditorContextMenuProps {
  className?: string;
  pageId: string;
  moduleInstance: ModuleInstance;
}

function EditorContextMenu({
  className,
  moduleInstance,
  pageId,
}: EditorContextMenuProps) {
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      value: page.pageName,
    }));
  });
  const dispatch = useDispatch();

  const isChangePermitted = hasManageModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

  const isDeletePermitted = hasDeleteModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

  const onDelete = () => {
    dispatch(
      deleteModuleInstance({
        id: moduleInstance.id,
        type: moduleInstance.type,
      }),
    );
  };

  const onDeleteClick = (e?: Event) => {
    e?.preventDefault();
    confirmDelete ? onDelete() : setConfirmDelete(true);
  };

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

  // Do not show anything if no items are available to use.
  if (!isDeletePermitted && !isChangePermitted) return null;

  return (
    <Menu className={className} onOpenChange={toggleMenuOpen} open={isMenuOpen}>
      <MenuTrigger>
        <Button
          data-testid="t--more-action-trigger"
          isIconButton
          kind="tertiary"
          size="md"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent loop style={{ zIndex: 100 }} width="200px">
        {isChangePermitted && (
          <MenuSub>
            <MenuSubTrigger startIcon="duplicate">
              {createMessage(CONTEXT_COPY)}
            </MenuSubTrigger>
            <MenuSubContent>
              {menuPages.map((page) => {
                return (
                  <MenuItem
                    key={page.id}
                    onSelect={() =>
                      copyModuleInstanceToPage(moduleInstance, page.id)
                    }
                  >
                    {page.label}
                  </MenuItem>
                );
              })}
            </MenuSubContent>
          </MenuSub>
        )}
        {isChangePermitted && (
          <MenuSub>
            <MenuSubTrigger startIcon="swap-horizontal">
              {createMessage(CONTEXT_MOVE)}
            </MenuSubTrigger>
            <MenuSubContent>
              {menuPages.length > 1 ? (
                menuPages
                  .filter((page) => page.id !== pageId) // Remove current page from the list
                  .map((page) => {
                    return (
                      <MenuItem
                        key={page.id}
                        onSelect={() =>
                          moveModuleInstanceToPage(moduleInstance, page.id)
                        }
                      >
                        {page.label}
                      </MenuItem>
                    );
                  })
              ) : (
                <MenuItem key="no-pages">No pages</MenuItem>
              )}
            </MenuSubContent>
          </MenuSub>
        )}
        {isDeletePermitted && (
          <MenuItem
            className="t--more-action-deleteBtn error-menuitem"
            onSelect={onDeleteClick}
            startIcon="trash"
          >
            {confirmDelete
              ? createMessage(CONFIRM_CONTEXT_DELETE)
              : createMessage(CONTEXT_DELETE)}
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

export default EditorContextMenu;
