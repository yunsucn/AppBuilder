export * from "ce/pages/common/ConvertEntityNotification";

import { Callout, Text } from "design-system";
import React from "react";
import styled from "styled-components";

interface ConvertEntityNotificationProps {
  icon: React.ReactNode;
  name: string;
  withPadding?: boolean;
}

const StyledCallout = styled(Callout)<{ withPadding: boolean }>`
  margin: 0
    ${({ withPadding }) => (withPadding ? "var(--ads-v2-spaces-7)" : "0")};
`;

const StyledText = styled(Text)`
  display: flex;
  align-items: center;
  gap: 4px;
`;

function ConvertEntityNotification({
  icon,
  name,
  withPadding = false,
}: ConvertEntityNotificationProps) {
  return (
    <StyledCallout kind="info" withPadding={withPadding}>
      <StyledText>
        We are replacing this with a module {icon} {name}. This process may take
        a few seconds.
      </StyledText>
    </StyledCallout>
  );
}

export default ConvertEntityNotification;
