export * from "ce/sagas";
import { sagas as CE_Sagas } from "ce/sagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { call, all, spawn, race, take } from "redux-saga/effects";
import log from "loglevel";
import * as sentry from "@sentry/react";
import AclSagas from "./AclSagas";
import AuditLogsSagas from "@appsmith/sagas/AuditLogsSagas";
import EnvironmentSagas from "./EnvironmentSagas";
import AISagas from "./aiSagas";
import ProvisioningSagas from "./ProvisioningSagas";
import PackagesSagas from "./packagesSagas";
import PackageInitSagas from "./packageInitSagas";
import WorkflowInitSagas from "./workflowInitSagas";
import ModuleInstanceSaga from "./moduleInstanceSagas";
import ModuleSagas from "./moduleSagas";
import WorkflowsSagas from "./workflowsSagas";
import WorkflowsActionSagas from "./workflowsActionSagas";
import ModuleActionSagas from "./moduleActionSagas";

const sagasArr = [
  ...CE_Sagas,
  AclSagas,
  AuditLogsSagas,
  EnvironmentSagas,
  AISagas,
  ProvisioningSagas,
  PackagesSagas,
  WorkflowsSagas,
  WorkflowsActionSagas,
  PackageInitSagas,
  WorkflowInitSagas,
  ModuleInstanceSaga,
  ModuleSagas,
  ModuleActionSagas,
];

export function* rootSaga(sagasToRun = sagasArr): any {
  // This race effect ensures that we fail as soon as the first safe crash is dispatched.
  // Without this, all the subsequent safe crash failures would be shown in the toast messages as well.
  const result = yield race({
    running: all(
      sagasToRun.map((saga) =>
        spawn(function* () {
          while (true) {
            try {
              yield call(saga);
              break;
            } catch (e) {
              log.error(e);
              sentry.captureException(e);
            }
          }
        }),
      ),
    ),
    crashed: take(ReduxActionTypes.SAFE_CRASH_APPSMITH),
  });
  if (result.crashed) yield call(rootSaga);
}
