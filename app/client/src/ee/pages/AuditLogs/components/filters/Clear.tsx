import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { StyledClearAllButton } from "../../styled-components/button";
import {
  fetchAuditLogsInit as fetchLogs,
  resetAuditLogsFilters as resetFilters,
} from "@appsmith/actions/auditLogsAction";
import { selectAuditLogsFiltersDirtyBit as isDirty } from "@appsmith/selectors/auditLogsSelectors";
import { initialAuditLogsFilterState as defaultFilters } from "@appsmith/reducers/auditLogsReducer";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { createMessage, CLEAR_ALL } from "@appsmith/constants/messages";

export default function Clear() {
  const dispatch = useDispatch();
  const dirty = useSelector(isDirty);

  function handleClear() {
    batch(() => {
      dispatch(resetFilters());
      /* Fetch logs with local data, since dispatch calls are batched */
      dispatch(fetchLogs({ ...defaultFilters }));

      AnalyticsUtil.logEvent("AUDIT_LOGS_CLEAR_FILTERS");
    });
  }

  return dirty ? (
    <StyledClearAllButton
      data-testid="t--audit-logs-filters-clear-all-button"
      kind="secondary"
      onClick={handleClear}
      size="md"
    >
      {createMessage(CLEAR_ALL)}
    </StyledClearAllButton>
  ) : null;
}
