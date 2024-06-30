import React, { useCallback, useMemo } from "react";
import { toValidPageName } from "utils/helpers";
import {
  hasDeleteModulePermission,
  hasManageModulePermission,
} from "@appsmith/utils/permissionHelpers";
import { saveModuleName } from "@appsmith/actions/moduleActions";
import history, { NavigationMethod } from "utils/history";
import Entity, { EntityClassNames } from "pages/Editor/Explorer/Entity";
import ModuleEntityContextMenu from "./ModuleEntityContextMenu";
import { moduleEditorURL } from "@appsmith/RouteBuilder";
import { useResolveIcon } from "@appsmith/pages/Editor/Explorer/hooks";
import type { Module } from "@appsmith/constants/ModuleConstants";

interface ModuleEntityProps {
  currentModuleId: string;
  module: Module;
  packageId: string;
  onItemSelected?: () => void;
}

const ModuleEntity = ({
  currentModuleId,
  module,
  onItemSelected,
  packageId,
}: ModuleEntityProps) => {
  const isCurrentModule = currentModuleId === module.id;
  const modulePermissions = module.userPermissions;
  const canManageModule = hasManageModulePermission(modulePermissions);
  const canDeleteModule = hasDeleteModulePermission(modulePermissions);
  const icon = useResolveIcon({
    moduleId: module.id,
  });

  const contextMenu = useMemo(
    () => (
      <ModuleEntityContextMenu
        canDeleteModule={canDeleteModule}
        canManageModule={canManageModule}
        className={EntityClassNames.CONTEXT_MENU}
        id={module.id}
        key={module.id + "_context-menu"}
        name={module.name}
      />
    ),
    [canDeleteModule, canManageModule, module.id, module.name, packageId],
  );

  const switchModule = useCallback(() => {
    const navigateToUrl = moduleEditorURL({ moduleId: module.id });
    history.push(navigateToUrl, {
      invokedBy: NavigationMethod.EntityExplorer,
    });
    onItemSelected?.();
  }, [module.id]);

  return (
    <Entity
      action={switchModule}
      active={isCurrentModule}
      canEditEntityName={canManageModule}
      className={`module ${isCurrentModule && "activeModule"} w-full`}
      contextMenu={contextMenu}
      entityId={module.id}
      icon={icon}
      isDefaultExpanded={isCurrentModule}
      key={module.id}
      name={module.name}
      onNameEdit={toValidPageName}
      searchKeyword={""}
      step={1}
      updateEntityName={(id, name) =>
        saveModuleName({
          id,
          name,
        })
      }
    />
  );
};

export default ModuleEntity;
