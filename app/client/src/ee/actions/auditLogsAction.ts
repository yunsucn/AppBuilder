import type {
  AuditLogType,
  DropdownOptionProps,
} from "@appsmith/pages/AuditLogs/types";
import type {
  DATE_SORT_ORDER,
  AuditLogsFiltersReduxState,
  AuditLogsDateFilter,
} from "@appsmith/reducers/auditLogsReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const setUserCanAccessAuditLogs = () => ({
  type: ReduxActionTypes.SET_USER_CAN_ACCESS_AUDIT_LOGS,
});

export const setUserCannotAccessAuditLogs = () => ({
  type: ReduxActionTypes.SET_USER_CANNOT_ACCESS_AUDIT_LOGS,
});

/**
 * refreshAuditLogsInit This function is fired when Refresh button is clicked on audit logs page.
 * This fetches filters and logs.
 * @param payload {AuditLogsFiltersReduxState}
 */
export const refreshAuditLogsInit = (payload: AuditLogsFiltersReduxState) => ({
  type: ReduxActionTypes.REFRESH_AUDIT_LOGS_INIT,
  payload,
});

export const setResourceIdJsonFilter = (payload: { resourceId: string }) => ({
  type: ReduxActionTypes.SET_RESOURCE_ID_JSON_FILTER,
  payload,
});

export const setOnlyEmailJsonFilter = (payload: {
  email: DropdownOptionProps;
}) => ({
  type: ReduxActionTypes.SET_ONLY_EMAIL_JSON_FILTER,
  payload,
});

export const setEmailJsonFilter = (payload: {
  email: DropdownOptionProps;
}) => ({
  type: ReduxActionTypes.ADD_EMAIL_JSON_FILTER,
  payload,
});

export const setEventJsonFilter = (payload: {
  event: DropdownOptionProps;
}) => ({
  type: ReduxActionTypes.ADD_EVENT_JSON_FILTER,
  payload,
});

export const setOnlyEventJsonFilter = (payload: {
  event: DropdownOptionProps;
}) => ({
  type: ReduxActionTypes.SET_ONLY_EVENT_JSON_FILTER,
  payload,
});

export const setOnlyResourceIdJsonFilter = (payload: {
  resourceId: string;
}) => ({
  type: ReduxActionTypes.SET_ONLY_RESOURCE_ID_JSON_FILTER,
  payload,
});

export const fetchAuditLogsSuccess = (payload: any[]) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_SUCCESS,
  payload,
});

export const fetchAuditLogsEmailsSuccess = (payload: any[]) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_EMAILS_SUCCESS,
  payload,
});

export const fetchAuditLogsEventsSuccess = (payload: any[]) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_EVENTS_SUCCESS,
  payload,
});

export const setAuditLogsOnUrlLoadFilters = (
  {
    emails,
    endDate,
    events,
    resourceId,
    sort,
    startDate,
  }: {
    emails: DropdownOptionProps[];
    events: DropdownOptionProps[];
    startDate: number;
    endDate: number;
    resourceId: string;
    sort: DATE_SORT_ORDER;
  },
  dirty: boolean,
) => ({
  type: ReduxActionTypes.SET_AUDIT_LOGS_ON_URL_LOAD_FILTERS,
  payload: {
    emails,
    events,
    startDate,
    endDate,
    resourceId,
    sort,
    dirty,
  },
});

export const resetAuditLogsFilters = () => ({
  type: ReduxActionTypes.RESET_AUDIT_LOGS_FILTERS,
});

export const setAuditLogsDateSortOrder = ({
  sort,
}: {
  sort: DATE_SORT_ORDER;
}) => ({
  type: ReduxActionTypes.SET_AUDIT_LOGS_DATE_SORT_FILTER,
  payload: { dateSortOrder: sort },
});

export const fetchAuditLogsMetadataInit = () => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_METADATA_INIT,
});

export const fetchAuditLogsInit = (filters: AuditLogsFiltersReduxState) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_INIT,
  payload: filters,
});

export const replaceAuditLogsEmails = (payload: {
  emails: DropdownOptionProps[];
}) => ({
  type: ReduxActionTypes.REPLACE_AUDIT_LOGS_SELECTED_EMAILS,
  payload: { emails: payload.emails },
});

export const replaceAuditLogsEvents = (payload: {
  events: DropdownOptionProps[];
}) => ({
  type: ReduxActionTypes.REPLACE_AUDIT_LOGS_SELECTED_EVENTS,
  payload: { events: payload.events },
});

export const setAuditLogsDateFilter = (payload: AuditLogsDateFilter) => ({
  type: ReduxActionTypes.SET_AUDIT_LOGS_DATE_FILTER,
  payload,
});

export const fetchAuditLogsNextPage = (
  payload: AuditLogsFiltersReduxState & { cursor: number },
) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_NEXT_PAGE_INIT,
  payload,
});

export const markAuditLogOpen = (payload: AuditLogType) => ({
  type: ReduxActionTypes.MARK_AUDIT_LOGS_LOG_OPEN,
  payload,
});

export const markAuditLogClose = (payload: AuditLogType) => ({
  type: ReduxActionTypes.MARK_AUDIT_LOGS_LOG_CLOSE,
  payload,
});

export const resetAuditLogs = () => ({
  type: ReduxActionTypes.RESET_AUDIT_LOGS,
});

/**
 * This action saves details about js action execution to the audit logs.
 * It uses /analytics/event because audit-logs is piggy-backing on the
 * analytics event.
 * @param payload
 */
export const logActionExecutionForAudit = (payload: {
  actionId: string;
  pageId: string;
  collectionId: string;
  actionName: string;
  pageName: string;
}) => {
  return {
    type: ReduxActionTypes.AUDIT_LOGS_LOG_ACTION_EXECUTION,
    payload,
  };
};
