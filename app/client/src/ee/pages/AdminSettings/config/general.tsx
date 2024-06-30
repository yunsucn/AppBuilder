export * from "ce/pages/AdminSettings/config/general";
import type {
  Setting,
  AdminConfigType,
} from "@appsmith/pages/AdminSettings/config/types";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import {
  config as CE_config,
  APPSMITH_INSTANCE_NAME_SETTING_SETTING,
  APPSMITH_ADMIN_EMAILS_SETTING,
  APPSMITH_DISABLE_TELEMETRY_SETTING,
  APPSMITH_HIDE_WATERMARK_SETTING as CE_APPSMITH_HIDE_WATERMARK_SETTING,
  APPSMITH_SINGLE_USER_PER_SESSION_SETTING as CE_APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
  APPSMITH_USER_SESSION_TIMEOUT_SETTING as CE_APPSMITH_USER_SESSION_TIMEOUT_SETTING,
  APPSMITH_IS_ATOMIC_PUSH_ALLOWED,
  APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING as CE_APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
  APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
} from "ce/pages/AdminSettings/config/general";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import {
  isBrandingEnabled,
  isUserSessionTimeoutEnabled,
  isProgramaticAccessControlEnabled,
  isUserSessionLimitEnabled,
} from "@appsmith/utils/planHelpers";
import store from "store";
import { isNumber } from "lodash";

function padTo2Digits(num: number) {
  return num.toString().padStart(2, "0");
}

const featureFlags = selectFeatureFlags(store.getState());
const isBrandingFFEnabled = isBrandingEnabled(featureFlags);
const isSessionLimitEnabled = isUserSessionLimitEnabled(featureFlags);
const isSessionTimeoutEnabled = isUserSessionTimeoutEnabled(featureFlags);
const isProgramaticAccessControlFFEnabled =
  isProgramaticAccessControlEnabled(featureFlags);

export const APPSMITH_HIDE_WATERMARK_SETTING: Setting = {
  ...CE_APPSMITH_HIDE_WATERMARK_SETTING,
  isFeatureEnabled: isBrandingFFEnabled,
  isDisabled: () => !isBrandingFFEnabled,
};

export const APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING: Setting = {
  ...CE_APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
  isFeatureEnabled: isProgramaticAccessControlFFEnabled,
  isDisabled: () => !isProgramaticAccessControlFFEnabled,
};

export const APPSMITH_SINGLE_USER_PER_SESSION_SETTING: Setting = {
  ...CE_APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
  isFeatureEnabled: isSessionLimitEnabled,
  isDisabled: () => !isSessionLimitEnabled,
};

export const APPSMITH_USER_SESSION_TIMEOUT_SETTING: Setting = {
  ...CE_APPSMITH_USER_SESSION_TIMEOUT_SETTING,
  isFeatureEnabled: isSessionTimeoutEnabled,
  isDisabled: () => !isSessionTimeoutEnabled,
  format: (value: string | number) => {
    // convert minutes to DD:HH:MM format
    // for string input on change
    if (!isNumber(value) || !value) {
      return value;
    }
    // for initial value from server
    const minutesInDay = 24 * 60;
    const minutesInHour = 60;
    const days = Math.floor(value / minutesInDay);
    const remainingMinutes = value % minutesInDay;
    const hours = Math.floor(remainingMinutes / minutesInHour);
    const minutes = remainingMinutes % minutesInHour;

    return `${padTo2Digits(days)}:${padTo2Digits(hours)}:${padTo2Digits(
      minutes,
    )}`;
  },
  parse: (value: string) => {
    if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value;
    }
    // convert DD:HH:MM to minutes
    const arr = value.split(":").map((v) => parseInt(v));
    const minutesInDay = 24 * 60;
    const minutesInHour = 60;
    const days = Math.floor(arr[0] * minutesInDay);
    const hours = Math.floor(arr[1] * minutesInHour);
    const minutes = Math.floor(arr[2]);
    return days + hours + minutes;
  },
  validate: (value: any) => {
    if (value < 1 || value > 43200) {
      return "Invalid user session timeout. Please set it to a duration between 1 minute and 30 days.";
    }
    if (Number.isNaN(value) || !isNumber(value)) {
      return "Invalid format. Please enter in DD:HH:MM format.";
    }
  },
};

const isAirgappedInstance = isAirgapped();

const settings = [
  APPSMITH_INSTANCE_NAME_SETTING_SETTING,
  APPSMITH_ADMIN_EMAILS_SETTING,
  APPSMITH_DISABLE_TELEMETRY_SETTING,
  APPSMITH_HIDE_WATERMARK_SETTING,
  APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
  APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
  APPSMITH_USER_SESSION_TIMEOUT_SETTING,
  APPSMITH_IS_ATOMIC_PUSH_ALLOWED,
  APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
];

const removalSettings: Setting[] = [];

if (isAirgappedInstance) {
  removalSettings.push(APPSMITH_DISABLE_TELEMETRY_SETTING);
}

export const config: AdminConfigType = {
  ...CE_config,
  settings: settings.filter((item) => !removalSettings.includes(item)),
} as AdminConfigType;
