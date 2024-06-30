export * from "ce/pages/workspace/helpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";

export const inviteUsersToWorkspace = async (
  values: any,
  dispatch: any,
): Promise<any> => {
  const workspaceData = {
    permissionGroupId: values.permissionGroupId,
    usernames: values.users ? values.users.split(",") : [],
    groups: values.groups ? values.groups.split(",") : [],
    workspaceId: values.workspaceId,
    ...("recaptchaToken" in values && {
      recaptchaToken: values.recaptchaToken,
    }),
  };
  const appData = {
    roleType: values.roleType,
    usernames: values.users ? values.users.split(",") : [],
    groups: values.groups ? values.groups.split(",") : [],
    applicationId: values.applicationId,
    ...("recaptchaToken" in values && {
      recaptchaToken: values.recaptchaToken,
    }),
  };
  return new Promise((resolve, reject) => {
    dispatch({
      type: values.isApplicationInvite
        ? ReduxActionTypes.INVITE_USERS_TO_APPLICATION_INIT
        : ReduxActionTypes.INVITE_USERS_TO_WORKSPACE_INIT,
      payload: {
        resolve,
        reject,
        data: values.isApplicationInvite ? appData : workspaceData,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};
