import React from "react";
import styled from "styled-components";
import { Button } from "design-system";

import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import ModuleInstanceNameEditor from "./ModuleInstanceNameEditor";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { moduleEditorURL } from "@appsmith/RouteBuilder";
import EditorContextMenu from "./EditorContextMenu";
import { GO_TO_MODULE, createMessage } from "@appsmith/constants/messages";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--ads-v2-color-gray-0);
  border-bottom: 1px solid var(--ads-v2-color-gray-300);
  padding: var(--ads-v2-spaces-6);
  gap: var(--ads-v2-spaces-4);
`;

const StyledSubheader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StyledSubheaderSection = styled.div<{ isContextMenuSection?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  width: 50%;

  ${({ isContextMenuSection }) =>
    isContextMenuSection ? "justify-content: flex-end;" : ""}
`;

interface HeaderProps {
  moduleInstance: ModuleInstance;
  packageId?: string;
  moduleId?: string;
  children: React.ReactNode;
  isDisabled: boolean;
}

function Header({
  children,
  isDisabled,
  moduleId,
  moduleInstance,
  packageId,
}: HeaderProps) {
  const pageId = useSelector(getCurrentPageId);

  const onGoToModuleClick = () => {
    urlBuilder.setPackageParams({ packageId });
    const url = moduleEditorURL({ moduleId, params: { branch: undefined } });
    window.open(url, "_blank");
  };

  return (
    <StyledContainer>
      <StyledSubheader>
        <StyledSubheaderSection>
          <ModuleInstanceNameEditor
            disabled={isDisabled}
            moduleInstance={moduleInstance}
          />
        </StyledSubheaderSection>
        <StyledSubheaderSection isContextMenuSection>
          <EditorContextMenu moduleInstance={moduleInstance} pageId={pageId} />
          {moduleId && packageId && (
            <Button
              kind="tertiary"
              onClick={onGoToModuleClick}
              size="md"
              startIcon="share-2"
            >
              {createMessage(GO_TO_MODULE)}
            </Button>
          )}
          {children}
        </StyledSubheaderSection>
      </StyledSubheader>
    </StyledContainer>
  );
}

export default Header;
