import React from "react";
import {
  ResourceHeading,
  CardListWrapper,
  PaddingWrapper,
  CardListContainer,
  Space,
} from "pages/Applications/CommonElements";
import WorkflowCard from "./WorkflowCard";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import { Flex } from "design-system";
import BetaCard from "components/editorComponents/BetaCard";
import { WORKFLOWS, createMessage } from "@appsmith/constants/messages";

export interface WorkflowCardListRendererProps {
  isFetchingWorkflows?: boolean;
  isMobile: boolean;
  workflows?: Workflow[];
  workspaceId: string;
}

function WorkflowCardListRenderer({
  isFetchingWorkflows = false,
  isMobile,
  workflows = [],
  workspaceId,
}: WorkflowCardListRendererProps) {
  if (workflows.length === 0) return null;
  return (
    <CardListContainer isMobile={isMobile}>
      <Flex alignItems="center" gap="spaces-3">
        <ResourceHeading isLoading={isFetchingWorkflows}>
          {createMessage(WORKFLOWS)}
        </ResourceHeading>
        <BetaCard />
      </Flex>
      <Space />
      <CardListWrapper isMobile={isMobile} key={workspaceId}>
        {workflows.map((workflow: any) => {
          return (
            <PaddingWrapper isMobile={isMobile} key={workflow.id}>
              <WorkflowCard
                isFetchingWorkflows={isFetchingWorkflows}
                isMobile={isMobile}
                key={workflow.id}
                workflow={workflow}
                workspaceId={workspaceId}
              />
            </PaddingWrapper>
          );
        })}
      </CardListWrapper>
    </CardListContainer>
  );
}

export default WorkflowCardListRenderer;
