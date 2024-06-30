import CreateNewModuleMenu from "@appsmith/pages/Editor/PackageExplorer/Modules/CreateNewModuleMenu";
import ModuleEntities from "@appsmith/pages/Editor/PackageExplorer/Modules/ModuleEntities";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { getCurrentPackage } from "@appsmith/selectors/packageSelectors";
import { hasCreateModulePermission } from "@appsmith/utils/permissionHelpers";
import { IDEHeaderDropdown } from "IDE";
import EntityAddButton from "pages/Editor/Explorer/Entity/AddButton";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Text } from "design-system";

interface ModulesSectionProps {
  onItemSelected: () => void;
}

function ModulesSection({ onItemSelected }: ModulesSectionProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const modules = useSelector(getAllModules);
  const currentPackage = useSelector(getCurrentPackage);
  const userPackagePermissions = currentPackage?.userPermissions ?? [];

  const canCreateModules = hasCreateModulePermission(userPackagePermissions);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => {
    setIsMenuOpen(false);
    onItemSelected?.();
  };

  return (
    <IDEHeaderDropdown>
      <IDEHeaderDropdown.Header className="modules">
        <Text kind="heading-xs">{`All Modules (${Object.keys(modules).length})`}</Text>
        {canCreateModules ? (
          <CreateNewModuleMenu
            canCreate={canCreateModules}
            closeMenu={closeMenu}
            isOpen={isMenuOpen}
            triggerElement={
              <EntityAddButton
                className="create-module-btn"
                onClick={openMenu}
              />
            }
          />
        ) : null}
      </IDEHeaderDropdown.Header>
      <IDEHeaderDropdown.Body>
        <ModuleEntities
          canCreateModules={canCreateModules}
          onItemSelected={onItemSelected}
          openCreateNewMenu={openMenu}
          packageId={currentPackage?.id || ""}
        />
      </IDEHeaderDropdown.Body>
    </IDEHeaderDropdown>
  );
}

export default ModulesSection;
