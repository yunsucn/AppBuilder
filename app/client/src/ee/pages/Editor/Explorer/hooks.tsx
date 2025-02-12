export * from "ce/pages/Editor/Explorer/hooks";
import React from "react";
import type { UseConvertToModulesOptionsProps } from "ce/pages/Editor/Explorer/hooks";
import { useActiveAction as useCEActiveAction } from "ce/pages/Editor/Explorer/hooks";
import {
  MODULE_INSTANCE_ID_PATH,
  basePathForActiveAction,
} from "@appsmith/constants/routes/appRoutes";
import { matchPath, useLocation } from "react-router";
import { noop } from "lodash";
import usePackageListToConvertEntity from "../EntityEditor/ConvertToModuleInstanceCTA/usePackageListToConvertEntity";
import {
  CONVERT_MODULE_CTA_TEXT,
  CONVERT_MODULE_TO_NEW_PKG_OPTION,
  createMessage,
} from "@appsmith/constants/messages";
import { convertEntityToInstance } from "@appsmith/actions/moduleInstanceActions";
import { useCallback } from "react";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import { useDispatch, useSelector } from "react-redux";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getPagePermissions } from "selectors/editorSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { hasCreatePackagePermission } from "@appsmith/utils/permissionHelpers";
import {
  getIsActionConverting,
  getPluginImages,
} from "@appsmith/selectors/entitiesSelector";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { Flex } from "design-system";
import BetaCard from "components/editorComponents/BetaCard";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import { getModuleIcon } from "pages/Editor/utils";

export function useActiveAction() {
  const location = useLocation();

  const path = basePathForActiveAction;

  const baseMatch = matchPath<{ apiId: string }>(location.pathname, {
    path,
    strict: false,
    exact: false,
  });

  const basePath = baseMatch?.path || "";

  const ceActiveAction = useCEActiveAction();

  if (ceActiveAction) return ceActiveAction;

  const moduleInstanceMatch = matchPath<{ moduleInstanceId: string }>(
    location.pathname,
    {
      path: `${basePath}${MODULE_INSTANCE_ID_PATH}`,
    },
  );
  if (moduleInstanceMatch?.params?.moduleInstanceId) {
    return moduleInstanceMatch.params.moduleInstanceId;
  }
}

export const useConvertToModuleOptions = ({
  canDelete,
  id,
  moduleType,
}: UseConvertToModulesOptionsProps): TreeDropdownOption | undefined => {
  const packages = usePackageListToConvertEntity();
  const dispatch = useDispatch();
  const hasPackages = Boolean(packages.length);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const showQueryModule = useSelector(getShowQueryModule);
  const pagePermissions = useSelector(getPagePermissions);
  const canCreateModuleInstance = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const canCreateNewPackage = hasCreatePackagePermission(
    currentWorkspace?.userPermissions,
  );
  const isConverting = useSelector((state) => getIsActionConverting(state, id));

  const canConvertEntity = canDelete && canCreateModuleInstance;

  const createNewModuleInstance = useCallback(
    ({ value }: TreeDropdownOption) => {
      const packageId = value === "" ? undefined : value;

      dispatch(
        convertEntityToInstance({
          moduleType,
          publicEntityId: id,
          packageId,
          initiatedFromPathname: location.pathname,
        }),
      );
    },
    [id, moduleType],
  );

  if (!showQueryModule) return undefined;

  const hasPackagesOrCanCreateNewPackage = hasPackages || canCreateNewPackage;

  const isCreateModuleBlocked =
    !canConvertEntity || !canCreateNewPackage || isConverting;

  const isOptionDisabled =
    isCreateModuleBlocked || !hasPackagesOrCanCreateNewPackage;

  const option: TreeDropdownOption = {
    value: "",
    onSelect: isOptionDisabled ? noop : createNewModuleInstance,
    label: (
      <Flex alignItems="center" gap="spaces-3">
        {createMessage(CONVERT_MODULE_CTA_TEXT)}
        <BetaCard />
      </Flex>
    ),
    disabled: isOptionDisabled,
  };

  if (hasPackagesOrCanCreateNewPackage) {
    option.children = packages.map((pkg) => ({
      label: `Add to ${pkg.name}`,
      value: pkg.id,
      onSelect: pkg.isDisabled ? noop : createNewModuleInstance,
      disabled: pkg.isDisabled,
      tooltipText: pkg.disabledTooltipText,
    }));

    // Add a divider
    if (hasPackages) {
      option.children?.push({
        value: "divider",
        onSelect: noop,
        label: "divider",
        type: "menu-divider",
      });
    }

    option.children?.push({
      value: "",
      onSelect: canCreateNewPackage ? createNewModuleInstance : noop,
      label: createMessage(CONVERT_MODULE_TO_NEW_PKG_OPTION),
      disabled: !canCreateNewPackage,
    });
  }

  return option;
};

export function useResolveIcon({
  isLargeIcon = false,
  moduleId,
}: {
  isLargeIcon?: boolean;
  moduleId: string;
}) {
  const module = useSelector((state) => getModuleById(state, moduleId));
  const pluginImages = useSelector(getPluginImages);

  return getModuleIcon(module, pluginImages, isLargeIcon);
}
