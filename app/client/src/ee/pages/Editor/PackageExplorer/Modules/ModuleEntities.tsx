import React from "react";

import { Icon } from "design-system";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { ENTITY_EXPLORER_RENDER_ORDER } from "@appsmith/constants/ModuleConstants";
import ModuleEntity from "./Entity";
import {
  getAllModules,
  getCurrentModuleId,
} from "@appsmith/selectors/modulesSelector";
import { useSelector } from "react-redux";
import {
  EMPTY_MODULES_MSG,
  NEW_MODULE_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import { AddEntity, EmptyComponent } from "pages/Editor/Explorer/common";
import { groupModules } from "./utils";

interface ModuleEntitiesProps {
  canCreateModules: boolean;
  packageId: string;
  openCreateNewMenu: () => void;
  onItemSelected?: () => void;
}

function ModuleEntities({
  canCreateModules,
  onItemSelected,
  openCreateNewMenu,
  packageId,
}: ModuleEntitiesProps) {
  const currentModuleId = useSelector(getCurrentModuleId);
  const modules = useSelector(getAllModules);
  const { modulesCount, modulesMap } = groupModules({
    modules,
  });

  const renderModule = (module: Module) => {
    return (
      <ModuleEntity
        currentModuleId={currentModuleId}
        key={module.id}
        module={module}
        onItemSelected={onItemSelected}
        packageId={packageId}
      />
    );
  };

  if (modulesCount === 0) {
    return (
      <EmptyComponent
        mainText={createMessage(EMPTY_MODULES_MSG)}
        {...(canCreateModules && {
          addBtnText: createMessage(NEW_MODULE_BUTTON),
          addFunction: openCreateNewMenu,
        })}
      />
    );
  }

  return (
    <>
      {ENTITY_EXPLORER_RENDER_ORDER.map((type) => {
        return modulesMap[type].map((m) => renderModule(m));
      })}

      {canCreateModules && (
        <AddEntity
          action={openCreateNewMenu}
          className="w-full"
          entityId={packageId}
          icon={<Icon name="plus" />}
          name={createMessage(NEW_MODULE_BUTTON)}
          step={1}
        />
      )}
    </>
  );
}

export default ModuleEntities;
