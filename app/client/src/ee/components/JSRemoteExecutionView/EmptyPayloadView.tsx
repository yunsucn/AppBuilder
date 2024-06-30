import React from "react";
import { Flex, Text } from "design-system";
import styled from "styled-components";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  EMPTY_PAYLOAD_VIEW_DESC,
  EMPTY_PAYLOAD_VIEW_TITLE,
  createMessage,
} from "@appsmith/constants/messages";

const DescText = styled(Text)`
  padding: 0 32px;
  text-align: center;
`;

const emptyPayloadIllustration = getAssetUrl(
  `${ASSETS_CDN_URL}/EmptyPayloadIllustration.svg`,
);

const Illustration = styled.img`
  height: 150px;
`;

function EmptyPayloadView() {
  return (
    <Flex
      alignItems="center"
      data-testid="t--empty-payload-view"
      flexDirection="column"
      justifyContent="center"
    >
      <Illustration loading="lazy" src={emptyPayloadIllustration} />
      <Text kind="heading-m">{createMessage(EMPTY_PAYLOAD_VIEW_TITLE)}</Text>
      <DescText kind="body-s">
        {createMessage(EMPTY_PAYLOAD_VIEW_DESC)}
      </DescText>
    </Flex>
  );
}

export default EmptyPayloadView;
