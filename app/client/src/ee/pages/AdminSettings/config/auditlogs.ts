export * from "ce/pages/AdminSettings/config/auditlogs";
import { config as CE_config } from "ce/pages/AdminSettings/config/auditlogs";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import store from "store";

import { isAuditLogsEnabled } from "@appsmith/utils/planHelpers";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import AuditLogsFeatureContainer from "@appsmith/pages/AuditLogs";

const featureFlags = selectFeatureFlags(store.getState());

const isFeatureEnabled = isAuditLogsEnabled(featureFlags);

export const config: AdminConfigType = {
  ...CE_config,
  ...(isFeatureEnabled
    ? {
        component: AuditLogsFeatureContainer,
        title: "Audit logs",
        isFeatureEnabled: isFeatureEnabled,
      }
    : {}),
} as AdminConfigType;
