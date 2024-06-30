import { DEFAULT_PACKAGE_ICON } from "@appsmith/constants/PackageConstants";
import { Icon, Text } from "design-system";
import React from "react";
import history from "utils/history";
import { SearchListItem } from "pages/common/SearchBar/WorkspaceSearchItems";
import { workflowEditorURL } from "@appsmith/RouteBuilder";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";

interface Props {
  workflowsList: Workflow[];
}

const WorkflowSearchItem = (props: Props) => {
  const { workflowsList } = props;
  if (!workflowsList || workflowsList?.length === 0) return null;
  return (
    <div>
      <Text className="!mb-2 !block" kind="body-s">
        Workflows
      </Text>
      {workflowsList.map((workflow: any) => (
        <SearchListItem
          key={workflow.id}
          onClick={() =>
            history.push(workflowEditorURL({ workflowId: workflow.id }))
          }
        >
          <Icon
            className="!mr-2"
            color="var(--ads-v2-color-fg)"
            name={workflow.icon || DEFAULT_PACKAGE_ICON}
            size="md"
          />
          <Text className="truncate" kind="body-m">
            {workflow.name}
          </Text>
        </SearchListItem>
      ))}
    </div>
  );
};

export default WorkflowSearchItem;
