import React from "react";
import PackageCard from "@appsmith/pages/Applications/PackageCard";
import {
  ResourceHeading,
  CardListWrapper,
  PaddingWrapper,
  CardListContainer,
  Space,
} from "pages/Applications/CommonElements";
import type { Package } from "@appsmith/constants/PackageConstants";
import BetaCard from "components/editorComponents/BetaCard";
import { Flex } from "design-system";

export interface PackageCardListRendererProps {
  createPackage: () => void;
  isCreatingPackage?: boolean;
  isFetchingPackages?: boolean;
  isMobile: boolean;
  packages?: Package[];
  workspaceId: string;
}

function PackageCardListRenderer({
  isFetchingPackages = false,
  isMobile,
  packages = [],
  workspaceId,
}: PackageCardListRendererProps) {
  if (packages.length === 0) return null;
  return (
    <CardListContainer isMobile={isMobile}>
      <Flex alignItems="center" gap="spaces-3">
        <ResourceHeading isLoading={isFetchingPackages}>
          Packages
        </ResourceHeading>
        <BetaCard />
      </Flex>
      <Space />
      <CardListWrapper isMobile={isMobile} key={workspaceId}>
        {packages.map((pkg: any) => {
          return (
            <PaddingWrapper isMobile={isMobile} key={pkg.id}>
              <PackageCard
                isFetchingPackages={isFetchingPackages}
                isMobile={isMobile}
                key={pkg.id}
                pkg={pkg}
                workspaceId={workspaceId}
              />
            </PaddingWrapper>
          );
        })}
      </CardListWrapper>
    </CardListContainer>
  );
}

export default PackageCardListRenderer;
