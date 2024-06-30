import React, { useMemo, useState } from "react";
import type { WorkflowRunDetailsActivities } from "@appsmith/reducers/uiReducers/workflowHistoryPaneReducer";
import {
  WorkflowActivityExecutionStatus,
  getWorkflowActivityStatusIconProps,
} from "./helpers";
import { Button, Icon, Text } from "design-system";
import moment from "moment";
import styled from "styled-components";
import classNames from "classnames";
import ReactJson from "react-json-view";

interface HistoryDetailsListItemProps {
  data: WorkflowRunDetailsActivities;
}

const StyledIcon = styled(Icon)`
  margin-right: 8px;
  margin-top: 3px;
`;

const EllipsisText = styled(Text)<{ collapsed: boolean }>`
  white-space: ${(props) => (props.collapsed ? "nowrap" : "normal")};
  overflow: hidden;
  text-overflow: ${(props) => (props.collapsed ? "ellipsis" : "clip")};
`;

const DescriptionContainer = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: ${(props) => (props.collapsed ? "24px" : "auto")};
  max-width: 325px;
`;

const RunHistoryListItemContainer = styled.div<{
  collapsed: boolean;
  collapsible: boolean;
}>`
  display: flex;
  flex-direction: row;
  height: ${(props) => (props.collapsed ? "24px" : "auto")};
  width: 100%;
  padding: 4px 0px;
  align-items: start;

  .debugger-toggle {
    ${(props) =>
      props.collapsed
        ? `transform: rotate(-90deg);`
        : `transform: rotate(0deg); `};
    opacity: ${(props) => (props.collapsible ? 1 : 0.5)};
  }
`;

const TimeText = styled(Text)`
  margin-left: auto;
  margin-right: 8px;
`;

const JsonWrapper = styled.div`
  padding: ${(props) => props.theme.spaces[1] - 1}px 0
    ${(props) => props.theme.spaces[5]}px;
  svg {
    color: var(--ads-v2-color-fg-muted) !important;
    height: 12px !important;
    width: 12px !important;
    vertical-align: baseline !important;
  }
  .object-key-val span,
  .icon-container {
    vertical-align: middle;
  }
  .brace-row {
    vertical-align: bottom;
  }
`;

const reactJsonProps = {
  name: null,
  enableClipboard: false,
  displayObjectSize: false,
  displayDataTypes: false,
  style: {
    fontFamily: "var(--ads-v2-font-family)",
    fontSize: "11px",
    fontWeight: "400",
    letterSpacing: "-0.195px",
    lineHeight: "13px",
    wordBreak: "break-all",
  },
  collapsed: 1,
};

const JSONView = (jsonObject: Record<string, any>) => {
  return (
    <JsonWrapper
      className="t--debugger-log-state"
      onClick={(e) => e.stopPropagation()}
    >
      <ReactJson src={jsonObject} {...reactJsonProps} />
    </JsonWrapper>
  );
};

export function RunHistoryDetailsListItem({
  data,
}: HistoryDetailsListItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const iconProps = getWorkflowActivityStatusIconProps(data.status);
  const time = moment(data.eventTime).format("D/MM/YY | H:mm:ss");
  const extraDetails = data.result;
  const collapsible = useMemo(() => {
    return (
      (extraDetails && Object.keys(extraDetails).length > 0) ||
      data.description.length > 100
    );
  }, [extraDetails, data.description]);

  const isConsoleLogItem = useMemo(() => {
    return data.status === WorkflowActivityExecutionStatus.CONSOLE;
  }, [data.status]);

  const showDescription = useMemo(() => {
    if (!isConsoleLogItem) {
      return true;
    } else {
      return !isOpen;
    }
  }, [isConsoleLogItem, isOpen]);

  const ExpandedView = useMemo(() => {
    if (collapsible && isOpen) {
      if (isConsoleLogItem && Array.isArray(extraDetails)) {
        return extraDetails.map((logArg, index) => {
          if (typeof logArg !== "object" || logArg === null) {
            return (
              <EllipsisText collapsed={!isOpen} key={index} kind="body-m">
                {logArg}
              </EllipsisText>
            );
          } else {
            return JSONView(logArg);
          }
        });
      }
      return JSONView(extraDetails);
    }
    return null;
  }, [collapsible, extraDetails, isOpen]);

  return (
    <RunHistoryListItemContainer
      collapsed={!isOpen}
      collapsible={collapsible}
      onClick={() => {
        if (collapsible) setIsOpen(!isOpen);
      }}
    >
      <Button
        className={classNames(`cs-icon debugger-toggle`)}
        isDisabled={!collapsible}
        isIconButton
        kind="tertiary"
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        startIcon={"expand-more"}
      />
      <StyledIcon {...iconProps} size="md" />
      <DescriptionContainer collapsed={!isOpen}>
        {showDescription && (
          <EllipsisText collapsed={!isOpen} kind="body-m">
            {data.description}
          </EllipsisText>
        )}
        {ExpandedView}
      </DescriptionContainer>
      <TimeText kind="body-m">{time}</TimeText>
    </RunHistoryListItemContainer>
  );
}
