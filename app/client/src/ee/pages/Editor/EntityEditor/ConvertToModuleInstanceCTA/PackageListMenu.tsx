import React, { useCallback, useState } from "react";
import {
  Button,
  Menu as ADS_Menu,
  MenuContent as ADS_MenuContent,
  MenuItem as ADS_MenuItem,
  MenuSeparator as ADS_MenuSeparator,
  MenuSub as ADS_MenuSub,
  MenuSubContent as ADS_MenuSubContent,
  MenuSubTrigger as ADS_MenuSubTrigger,
  MenuTrigger as ADS_MenuTrigger,
  Tooltip,
} from "design-system";

import { kebabCase, noop } from "lodash";
import type { ConvertPackageList } from "./usePackageListToConvertEntity";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import {
  CONVERT_MODULE_TO_NEW_PKG_OPTION,
  createMessage,
} from "@appsmith/constants/messages";

export interface OnItemClickProps {
  packageId?: string;
}

interface PackageListMenuProps {
  packages: ConvertPackageList;
  isDisabled: boolean;
  onItemClick: (props: OnItemClickProps) => void;
  canCreateNewPackage: boolean;
  title: React.ReactNode;
}

interface EditorModeProp {
  editorMode: EditorViewMode;
}

interface MenuProps extends EditorModeProp {
  children: React.ReactNode;
  open: boolean;
}

const Menu = ({ children, editorMode, open }: MenuProps) => {
  return editorMode === EditorViewMode.SplitScreen ? (
    <ADS_MenuSub>{children}</ADS_MenuSub>
  ) : (
    <ADS_Menu data-testid="t--convert-entity-menu" open={open}>
      {children}
    </ADS_Menu>
  );
};

interface MenuTriggerProps extends EditorModeProp {
  isDisabled: boolean;
  title: React.ReactNode;
  openMenu: () => void;
}

const MenuTrigger = ({
  editorMode,
  isDisabled,
  openMenu,
  title,
}: MenuTriggerProps) => {
  return editorMode === EditorViewMode.SplitScreen ? (
    <ADS_MenuSubTrigger>{title}</ADS_MenuSubTrigger>
  ) : (
    <ADS_MenuTrigger>
      <Button
        className="convert-module-trigger"
        data-testid="t--convert-module-btn"
        endIcon="arrow-down-s-line"
        isDisabled={isDisabled}
        kind="tertiary"
        onClick={openMenu}
        size="md"
      >
        {title}
      </Button>
    </ADS_MenuTrigger>
  );
};

interface MenuContentProps extends EditorModeProp {
  children: React.ReactNode;
  closeMenu: () => void;
}

const MenuContent = ({ children, closeMenu, editorMode }: MenuContentProps) => {
  return editorMode === EditorViewMode.SplitScreen ? (
    <ADS_MenuSubContent>{children}</ADS_MenuSubContent>
  ) : (
    <ADS_MenuContent
      align="center"
      onInteractOutside={() => closeMenu()}
      width="215px"
    >
      {children}
    </ADS_MenuContent>
  );
};

function PackageListMenu({
  canCreateNewPackage,
  isDisabled,
  onItemClick,
  packages,
  title,
}: PackageListMenuProps) {
  const editorMode = useSelector(getIDEViewMode);
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  const onMenuItemClick = useCallback(
    (props: OnItemClickProps) => {
      onItemClick(props);
      closeMenu();
    },
    [onItemClick, closeMenu],
  );

  return (
    <Menu editorMode={editorMode} open={isOpen}>
      <MenuTrigger
        editorMode={editorMode}
        isDisabled={isDisabled}
        openMenu={openMenu}
        title={title}
      />
      <MenuContent closeMenu={closeMenu} editorMode={editorMode}>
        {packages.map((pkg) => {
          return (
            <Tooltip
              content={pkg.disabledTooltipText}
              isDisabled={!pkg.disabledTooltipText}
              key={pkg.id}
              placement="top"
            >
              <ADS_MenuItem
                data-testid={`t-add-to-${kebabCase(pkg.name)}`}
                disabled={pkg.isDisabled}
                key={pkg.id}
                onSelect={() =>
                  pkg.isDisabled ? noop : onMenuItemClick({ packageId: pkg.id })
                }
              >
                Add to {pkg.name}
              </ADS_MenuItem>
            </Tooltip>
          );
        })}
        <ADS_MenuSeparator />
        <ADS_MenuItem
          data-testid="t-add-to-new-package"
          disabled={!canCreateNewPackage}
          onSelect={() =>
            canCreateNewPackage
              ? onMenuItemClick({ packageId: undefined })
              : noop
          }
        >
          {createMessage(CONVERT_MODULE_TO_NEW_PKG_OPTION)}
        </ADS_MenuItem>
      </MenuContent>
    </Menu>
  );
}

export default PackageListMenu;
