import React, { useEffect, useMemo } from "react";
import { saveSettings } from "@appsmith/actions/settingsAction";
import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import _ from "lodash";
import { connect, useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { useParams, withRouter } from "react-router";
import type { AppState } from "@appsmith/reducers";
import type { InjectedFormProps } from "redux-form";
import { formValueSelector, reduxForm } from "redux-form";
import {
  getSettings,
  getSettingsSavingState,
} from "selectors/settingsSelectors";
import Group from "pages/AdminSettings/FormGroup/group";
import { DisconnectService } from "pages/AdminSettings/DisconnectService";
import RestartBanner from "pages/AdminSettings/RestartBanner";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import SaveAdminSettings from "pages/AdminSettings/SaveSettings";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import {
  createMessage,
  DISCONNECT_AUTH_ERROR,
  DISCONNECT_SERVICE_SUBHEADER,
  DISCONNECT_SERVICE_WARNING,
  MANDATORY_FIELDS_ERROR,
} from "@appsmith/constants/messages";
import { toast } from "design-system";
import {
  isTenantConfig,
  saveAllowed,
} from "@appsmith/utils/adminSettingsHelpers";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import {
  Wrapper,
  BottomSpace,
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
  SettingsFormWrapper,
} from "pages/AdminSettings/components";
import { BackButton } from "components/utils/helperComponents";
import {
  getIsFormLoginEnabled,
  getThirdPartyAuths,
} from "@appsmith/selectors/tenantSelectors";
import { adminSettingsCategoryUrl } from "@appsmith/RouteBuilder";
import history from "utils/history";
import { updateTenantConfig } from "@appsmith/actions/tenantActions";

interface FormProps {
  settings: Record<string, string>;
  settingsConfig: Record<string, string | boolean>;
  defaultSettings: Record<string, string>;
  isSaving: boolean;
}

function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

function getSettingDetail(category: string, subCategory: string) {
  return AdminConfig.getCategoryDetails(category, subCategory);
}

function getSettingsConfig(category: string, subCategory?: string) {
  return AdminConfig.get(subCategory ?? category);
}

export function OidcSettingsForm(
  props: InjectedFormProps & RouteComponentProps & FormProps,
) {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;

  const { defaultSettings, settings, settingsConfig } = props;
  const details = getSettingDetail(category, subCategory);
  const settingsDetails = getSettingsConfig(category, subCategory);
  const newSettings = useMemo(() => {
    return { ...settings };
  }, [settings]);

  const isFeatureEnabled = details?.isFeatureEnabled;

  useEffect(() => {
    if (!isFeatureEnabled) {
      history.push(
        adminSettingsCategoryUrl({
          category: SettingCategories.AUTHENTICATION,
        }),
      );
    }
  }, [isFeatureEnabled]);

  const dispatch = useDispatch();
  const isSavable = AdminConfig.savableCategories.includes(
    subCategory ?? category,
  );
  const pageTitle = getSettingLabel(
    details?.title || (subCategory ?? category),
  );
  const isFormLoginEnabled = useSelector(getIsFormLoginEnabled);
  const socialLoginList = useSelector(getThirdPartyAuths);
  const isConnected = socialLoginList.includes("oidc");

  const updatedTenantSettings = useMemo(
    () => Object.keys(newSettings).filter((s) => isTenantConfig(s)),
    [newSettings],
  );

  /* Is there a non-tenant (env) config in this category of settings? */
  const isOnlyTenantConfig = !settingsDetails.find(
    (s) =>
      s.category === (subCategory ?? category) &&
      s.controlType != SettingTypes.CALLOUT &&
      !isTenantConfig(s.id),
  );

  const saveChangedSettings = () => {
    /* send default settings for the settings that are not changed for the first time */
    Object.keys(defaultSettings).forEach((setting) => {
      if (
        !newSettings[setting] &&
        defaultSettings[setting] &&
        defaultSettings[setting] === settingsConfig[setting] &&
        newSettings["APPSMITH_OAUTH2_OIDC_CLIENT_ID"]
      ) {
        newSettings[setting] = defaultSettings[setting];
      }
    });

    /* for tenant settings */
    const config: Record<string, any> = {};
    for (const settingName in newSettings) {
      if (isTenantConfig(settingName)) {
        config[settingName] = newSettings[settingName];
        delete newSettings[settingName];
      }
    }

    if (updatedTenantSettings.length > 0) {
      dispatch(
        updateTenantConfig({
          tenantConfiguration: config,
          isOnlyTenantSettings: !(Object.keys(newSettings).length > 0),
          needsRefresh: details?.needsRefresh,
        }),
      );
    }

    /* for env settings */
    if (Object.keys(newSettings).length > 0) {
      dispatch(saveSettings(newSettings));
    }
  };

  const onSave = () => {
    if (checkMandatoryFileds()) {
      if (saveAllowed(newSettings, isFormLoginEnabled, socialLoginList)) {
        AnalyticsUtil.logEvent("ADMIN_SETTINGS_SAVE", {
          method: pageTitle,
        });
        saveChangedSettings();
      } else {
        saveBlocked();
      }
    } else {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
        error: createMessage(MANDATORY_FIELDS_ERROR),
      });
      toast.show(createMessage(MANDATORY_FIELDS_ERROR), {
        kind: "error",
      });
    }
  };

  const checkMandatoryFileds = () => {
    const requiredFields = settingsDetails.filter((eachSetting) => {
      const isInitialSettingBlank =
        settingsConfig[eachSetting.id]?.toString().trim() === "" ||
        settingsConfig[eachSetting.id] === undefined;
      const isInitialSettingNotBlank = settingsConfig[eachSetting.id];
      const isNewSettingBlank =
        settings[eachSetting.id]?.toString()?.trim() === "";
      const isNewSettingNotBlank = !settings[eachSetting.id];

      if (
        eachSetting.isRequired &&
        !eachSetting.isHidden &&
        ((isInitialSettingBlank && isNewSettingNotBlank) ||
          (isInitialSettingNotBlank && isNewSettingBlank))
      ) {
        return eachSetting.id;
      }
    });

    return !(requiredFields.length > 0);
  };

  const onClear = (event?: React.FocusEvent<any, any>) => {
    if (event?.type === "click") {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_RESET", {
        method: pageTitle,
      });
    }
    props.initialize(props.settingsConfig);
  };

  useEffect(onClear, []);

  const saveBlocked = () => {
    AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
      error: createMessage(DISCONNECT_AUTH_ERROR),
    });
    toast.show(createMessage(DISCONNECT_AUTH_ERROR), {
      kind: "error",
    });
  };

  const disconnect = (currentSettings: AdminConfig) => {
    const updatedSettings: any = {};
    const connectedMethodsCount =
      socialLoginList.length + (isFormLoginEnabled ? 1 : 0);
    if (connectedMethodsCount >= 2) {
      _.forEach(currentSettings, (setting: Setting) => {
        if (
          !setting.isHidden &&
          [
            SettingTypes.LINK,
            SettingTypes.ACCORDION,
            SettingTypes.UNEDITABLEFIELD,
          ].indexOf(setting.controlType) === -1 &&
          [
            "APPSMITH_OAUTH2_OIDC_CLIENT_ID",
            "APPSMITH_OAUTH2_OIDC_CLIENT_SECRET",
          ].indexOf(setting.id) !== -1
        ) {
          updatedSettings[setting.id] = "";
        }
        if (setting.controlType === SettingTypes.ACCORDION) {
          _.forEach(setting.advanced, (subSetting: Setting) => {
            if (!subSetting.isHidden) {
              updatedSettings[subSetting.id] = "";
            }
          });
        }
      });
      dispatch(saveSettings(updatedSettings));
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_DISCONNECT_AUTH_METHOD", {
        method: pageTitle,
      });
    } else {
      saveBlocked();
    }
  };

  return (
    <Wrapper>
      {subCategory && <BackButton />}
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            {pageTitle}
          </SettingsHeader>
          {details?.subText && (
            <SettingsSubHeader
              color="var(--ads-v2-color-fg-emphasis)"
              kind="body-m"
              renderAs="h2"
            >
              {details.subText}
            </SettingsSubHeader>
          )}
        </HeaderWrapper>
        <Group
          category={category}
          settings={settingsDetails}
          subCategory={subCategory}
        />
        {isSavable && (
          <SaveAdminSettings
            isOnlyTenantConfig={isOnlyTenantConfig}
            isSaving={props.isSaving}
            onClear={onClear}
            onSave={onSave}
            settings={newSettings}
            updatedTenantSettings={updatedTenantSettings}
            valid={props.valid}
          />
        )}
        {isConnected && (
          <DisconnectService
            disconnect={() => disconnect(settingsDetails)}
            subHeader={createMessage(DISCONNECT_SERVICE_SUBHEADER)}
            warning={`${pageTitle} ${createMessage(
              DISCONNECT_SERVICE_WARNING,
            )}`}
          />
        )}
        <BottomSpace />
      </SettingsFormWrapper>
      <RestartBanner />
    </Wrapper>
  );
}

const validate = (values: Record<string, any>) => {
  const errors: any = {};
  _.filter(values, (value, name) => {
    const err_message = AdminConfig.validate(name, value);
    if (err_message) {
      errors[name] = err_message;
    }
  });
  return errors;
};

const selector = formValueSelector(SETTINGS_FORM_NAME);
export default withRouter(
  connect((state: AppState) => {
    const settingsConfig = getSettings(state);
    const defaultSettings = {
      APPSMITH_OAUTH2_OIDC_SCOPE: "openid,profile,email",
      APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE: "email",
    };
    const newProps: any = {
      settings: {},
      settingsConfig: {
        ...settingsConfig,
        APPSMITH_OAUTH2_OIDC_SCOPE:
          settingsConfig["APPSMITH_OAUTH2_OIDC_SCOPE"] ||
          defaultSettings["APPSMITH_OAUTH2_OIDC_SCOPE"],
        APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE:
          settingsConfig["APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE"] ||
          defaultSettings["APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE"],
      },
      defaultSettings,
      isSaving: getSettingsSavingState(state),
    };

    Object.keys(AdminConfig.settingsMap).forEach((name) => {
      const fieldValue = selector(state, name);

      if (fieldValue !== newProps.settingsConfig[name]) {
        newProps.settings[name] = fieldValue;
      }
    });
    return newProps;
  }, null)(
    reduxForm<any, any>({
      validate,
      form: SETTINGS_FORM_NAME,
      touchOnBlur: true,
    })(OidcSettingsForm),
  ),
);
