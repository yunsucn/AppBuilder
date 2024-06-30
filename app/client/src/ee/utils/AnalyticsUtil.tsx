export * from "ce/utils/AnalyticsUtil";
import {
  default as CE_AnalyticsUtil,
  AnalyticsEventType,
  getParentContextFromURL,
  getApplicationId,
} from "ce/utils/AnalyticsUtil";
import * as log from "loglevel";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "@appsmith/configs";
import * as Sentry from "@sentry/react";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { sha256 } from "js-sha256";
import type { EventName } from "@appsmith/utils/analyticsUtilTypes";
import type { License } from "@appsmith/reducers/tenantReducer";

export function getUserSource() {
  const { cloudHosting } = getAppsmithConfigs();
  const source = cloudHosting ? "cloud" : "ee";
  return source;
}

class AnalyticsUtil extends CE_AnalyticsUtil {
  static license?: License | undefined = undefined;

  static initLicense(license: License) {
    AnalyticsUtil.license = license;
  }

  static logEvent(
    eventName: EventName,
    eventData: any = {},
    eventType?: AnalyticsEventType,
  ) {
    if (AnalyticsUtil.blockTrackEvent) {
      return;
    }
    if (
      AnalyticsUtil.blockErrorLogs &&
      eventType === AnalyticsEventType.error
    ) {
      return;
    }

    const windowDoc: any = window;
    let finalEventData = eventData;
    const userData = AnalyticsUtil.user;
    const parentContext = getParentContextFromURL(windowDoc.location);
    const instanceId = AnalyticsUtil.instanceId;
    const appId = getApplicationId(windowDoc.location);
    const externalLicenseId = AnalyticsUtil.license?.id || "";
    const { appVersion, segment } = getAppsmithConfigs();
    if (userData) {
      const source = getUserSource();
      let user: any = {};
      if (segment.apiKey) {
        user = {
          userId: userData.username,
          email: userData.email,
          appId,
        };
      } else {
        const userId = userData.username;
        if (userId !== AnalyticsUtil.cachedUserId) {
          AnalyticsUtil.cachedAnonymoustId = sha256(userId);
          AnalyticsUtil.cachedUserId = userId;
        }
        user = {
          userId: AnalyticsUtil.cachedAnonymoustId,
        };
      }
      finalEventData = {
        ...eventData,
        userData:
          user.userId === ANONYMOUS_USERNAME ? undefined : { ...user, source },
      };
    }
    finalEventData = {
      ...finalEventData,
      instanceId,
      version: appVersion.id,
      ...(externalLicenseId ? { externalLicenseId } : {}),
      ...(parentContext ? { parentContext } : {}),
    };

    if (windowDoc.analytics) {
      log.debug("Event fired", eventName, finalEventData);
      windowDoc.analytics.track(eventName, finalEventData);
    } else {
      log.debug("Event fired locally", eventName, finalEventData);
    }
  }

  static identifyUser(userData: User, sendAdditionalData?: boolean) {
    const { appVersion, segment, sentry, smartLook } = getAppsmithConfigs();
    const windowDoc: any = window;
    const userId = userData.username;
    if (windowDoc.analytics) {
      const source = getUserSource();
      // This flag is only set on Appsmith Cloud. In this case, we get more detailed analytics of the user
      if (segment.apiKey) {
        const userProperties = {
          userId: userId,
          source,
          email: userData.email,
          name: userData.name,
          emailVerified: userData.emailVerified,
        };
        AnalyticsUtil.user = userData;
        log.debug("Identify User " + userId);
        windowDoc.analytics.identify(userId, userProperties);
      } else if (segment.ceKey) {
        // This is a self-hosted instance. Only send data if the analytics are NOT disabled by the user
        if (userId !== AnalyticsUtil.cachedUserId) {
          AnalyticsUtil.cachedAnonymoustId = sha256(userId);
          AnalyticsUtil.cachedUserId = userId;
        }
        const userProperties = {
          userId: AnalyticsUtil.cachedAnonymoustId,
          source,
          ...(sendAdditionalData
            ? {
                id: AnalyticsUtil.cachedAnonymoustId,
                email: userData.email,
                version: `Appsmith ${appVersion.edition} ${appVersion.id}`,
                instanceId: AnalyticsUtil.instanceId,
              }
            : {}),
        };
        log.debug(
          "Identify Anonymous User " + AnalyticsUtil.cachedAnonymoustId,
        );
        windowDoc.analytics.identify(
          AnalyticsUtil.cachedAnonymoustId,
          userProperties,
        );
      }
    }

    if (sentry.enabled) {
      Sentry.configureScope(function (scope) {
        scope.setUser({
          id: userId,
          username: userData.username,
          email: userData.email,
        });
      });
    }

    if (smartLook.enabled) {
      smartlookClient.identify(userId, { email: userData.email });
    }

    // If zipy was included, identify this user on the platform
    if (window.zipy && userId) {
      window.zipy.identify(userId, {
        email: userData.email,
        username: userData.username,
      });
    }

    AnalyticsUtil.blockTrackEvent = false;
  }
}

export default AnalyticsUtil;
