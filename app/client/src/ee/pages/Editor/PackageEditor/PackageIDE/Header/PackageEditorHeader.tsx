import React, { useState } from "react";
import { Flex, Text, Button } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { EditInteractionKind, SavingState } from "design-system-old";

import { createMessage, HEADER_TITLES } from "@appsmith/constants/messages";
import EditorName from "pages/Editor/EditorName";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { EditorSaveIndicator } from "pages/Editor/EditorSaveIndicator";
import {
  getCurrentPackage,
  getisErrorSavingPackageName,
  getIsPackagePublishing,
  getIsSavingPackageName,
  getPackagesList,
} from "@appsmith/selectors/packageSelectors";
import {
  publishPackage,
  updatePackage,
} from "@appsmith/actions/packageActions";
import {
  getCurrentModule,
  getIsModuleSaving,
} from "@appsmith/selectors/modulesSelector";
import type { Package } from "@appsmith/constants/PackageConstants";
import { IDEHeader, IDEHeaderTitle } from "IDE";
import type { Module } from "@appsmith/constants/ModuleConstants";
import PackageHeaderEditorTitle from "./PackageHeaderEditorTitle";
import { GetNavigationMenuData } from "../../EditorPackageName/NavigationMenuData";
import useCurrentPackageState from "../hooks";

interface HeaderTitleProps {
  packageState: EditorState;
  currentModule?: Module;
}

const HeaderTitleComponent = ({
  currentModule,
  packageState,
}: HeaderTitleProps) => {
  switch (packageState) {
    case EditorState.DATA:
      return (
        <IDEHeaderTitle
          key={packageState}
          title={createMessage(HEADER_TITLES.DATA)}
        />
      );
    case EditorState.EDITOR:
      return (
        <PackageHeaderEditorTitle
          key={packageState}
          title={currentModule?.name || ""}
        />
      );
    case EditorState.SETTINGS:
      return (
        <IDEHeaderTitle
          key={packageState}
          title={createMessage(HEADER_TITLES.SETTINGS)}
        />
      );
    case EditorState.LIBRARIES:
      return (
        <IDEHeaderTitle
          key={packageState}
          title={createMessage(HEADER_TITLES.LIBRARIES)}
        />
      );
    default:
      return (
        <PackageHeaderEditorTitle
          key={packageState}
          title={currentModule?.name || ""}
        />
      );
  }
};

const PackageEditorHeader = () => {
  const dispatch = useDispatch();

  // selectors
  const currentPackage = useSelector(getCurrentPackage);
  const packageId = currentPackage?.id || "";
  const packageList = useSelector(getPackagesList) || [];
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const isModuleSaving = useSelector(getIsModuleSaving);
  const isSavingName = useSelector(getIsSavingPackageName);
  const isErroredSavingName = useSelector(getisErrorSavingPackageName);
  const isPublishing = useSelector(getIsPackagePublishing);
  const currentModule = useSelector(getCurrentModule);
  const packageState = useCurrentPackageState();

  const onPublishPackage = () => {
    if (packageId) {
      dispatch(publishPackage({ packageId }));
    }
  };

  const onUpdatePackage = (val: string, pkg: Package | null) => {
    if (val !== pkg?.name) {
      dispatch(
        updatePackage({
          name: val,
          id: pkg?.id || packageId,
        }),
      );
    }
  };

  // states
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  return (
    <IDEHeader>
      <IDEHeader.Left>
        <HeaderTitleComponent
          currentModule={currentModule}
          packageState={packageState}
        />
        <EditorSaveIndicator
          isSaving={isModuleSaving}
          saveError={isErroredSavingName}
        />
      </IDEHeader.Left>
      <IDEHeader.Center>
        <Flex alignItems={"center"}>
          {currentWorkspace.name && (
            <>
              <Text
                color="var(--ads-v2-colors-content-label-inactive-fg)"
                kind="body-m"
              >
                {currentWorkspace.name + " / "}
              </Text>
              <EditorName
                className="t--package-name editable-package-name max-w-48"
                defaultSavingState={
                  isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
                }
                defaultValue={currentPackage?.name || ""}
                editInteractionKind={EditInteractionKind.SINGLE}
                editorName="Package"
                fill
                getNavigationMenu={GetNavigationMenuData}
                isError={isErroredSavingName}
                isNewEditor={
                  packageList.filter((el) => el.id === packageId).length > 0 // ankita: update later, this is always true for package
                }
                isPopoverOpen={isPopoverOpen}
                onBlur={(value: string) =>
                  onUpdatePackage(value, currentPackage)
                }
                setIsPopoverOpen={setIsPopoverOpen}
              />
            </>
          )}
        </Flex>
      </IDEHeader.Center>
      <IDEHeader.Right>
        <div className="flex items-center">
          <Button
            data-testid="t--package-publish-btn"
            isLoading={isPublishing}
            kind="tertiary"
            onClick={onPublishPackage}
            size="md"
            startIcon={"rocket"}
          >
            Publish
          </Button>
        </div>
      </IDEHeader.Right>
    </IDEHeader>
  );
};

export default PackageEditorHeader;
