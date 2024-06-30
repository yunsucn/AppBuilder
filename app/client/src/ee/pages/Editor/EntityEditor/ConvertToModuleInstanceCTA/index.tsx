export * from "ce/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";
import type { ConvertToModuleInstanceCTAProps } from "ce/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";

import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Flex, MenuItem, Tag } from "design-system";

import PackageListMenu from "./PackageListMenu";
import { convertEntityToInstance } from "@appsmith/actions/moduleInstanceActions";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { hasCreatePackagePermission } from "@appsmith/utils/permissionHelpers";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import usePackageListToConvertEntity from "./usePackageListToConvertEntity";
import type { OnItemClickProps } from "./PackageListMenu";
import {
  BETA_TAG,
  CONVERT_MODULE_CTA_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { noop } from "lodash";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";

function ConvertToModuleInstanceCTA({
  canCreateModuleInstance,
  canDeleteEntity,
  entityId,
  moduleType,
}: ConvertToModuleInstanceCTAProps) {
  const packages = usePackageListToConvertEntity();
  const dispatch = useDispatch();
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const canCreateNewPackage = hasCreatePackagePermission(
    currentWorkspace?.userPermissions,
  );
  const showQueryModule = useSelector(getShowQueryModule);
  const canConvertEntity = canDeleteEntity && canCreateModuleInstance;
  const editorMode = useSelector(getIDEViewMode);

  const createNewModuleInstance = useCallback(
    ({ packageId }: OnItemClickProps) => {
      dispatch(
        convertEntityToInstance({
          moduleType,
          publicEntityId: entityId,
          packageId,
          initiatedFromPathname: location.pathname,
        }),
      );
    },
    [entityId, moduleType],
  );

  const buttonTitle = (
    <Flex alignItems="center" gap="spaces-2">
      {createMessage(CONVERT_MODULE_CTA_TEXT)}
      <Tag isClosable={false}>{createMessage(BETA_TAG)}</Tag>
    </Flex>
  );

  if (!showQueryModule) {
    return null;
  }

  if (packages.length === 0) {
    const isDisabled = !canConvertEntity || !canCreateNewPackage;
    const onClickHandler = () =>
      isDisabled ? noop : createNewModuleInstance({ packageId: undefined });

    return editorMode === EditorViewMode.SplitScreen ? (
      <MenuItem onSelect={onClickHandler}>{buttonTitle}</MenuItem>
    ) : (
      <Button
        data-testid="t--convert-module-btn"
        isDisabled={isDisabled}
        kind="secondary"
        onClick={onClickHandler}
        size="md"
      >
        {buttonTitle}
      </Button>
    );
  }

  return (
    <PackageListMenu
      canCreateNewPackage={canCreateNewPackage}
      isDisabled={!canConvertEntity}
      onItemClick={createNewModuleInstance}
      packages={packages}
      title={buttonTitle}
    />
  );
}

export default ConvertToModuleInstanceCTA;
