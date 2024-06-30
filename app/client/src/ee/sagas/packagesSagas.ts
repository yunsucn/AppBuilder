import { takeLatest, all, call, put, select } from "redux-saga/effects";

import history from "utils/history";
import PackageApi from "@appsmith/api/PackageApi";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import {
  CREATE_PACKAGE_ERROR,
  createMessage,
  ERROR_IMPORT_PACKAGE,
  FETCH_PACKAGE_ERROR,
  FETCH_PACKAGES_ERROR,
} from "@appsmith/constants/messages";
import {
  getIsFetchingPackages,
  getPackagesList,
} from "@appsmith/selectors/packageSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  DEFAULT_PACKAGE_COLOR,
  DEFAULT_PACKAGE_ICON,
  DEFAULT_PACKAGE_PREFIX,
} from "@appsmith/constants/PackageConstants";
import { BASE_PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import type { ApiResponse } from "api/ApiResponses";
import type {
  CreatePackageFromWorkspacePayload,
  DeletePackagePayload,
  FetchConsumablePackagesInWorkspacePayload,
  FetchPackagePayload,
  ImportPackagePayload,
  PublishPackagePayload,
} from "@appsmith/actions/packageActions";
import type {
  CreatePackagePayload,
  FetchPackageResponse,
  ImportPackageResponse,
} from "@appsmith/api/PackageApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  Package,
  PackageMetadata,
} from "@appsmith/constants/PackageConstants";
import { toast } from "design-system";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import analytics from "@appsmith/utils/Packages/analytics";
import { setUnconfiguredDatasourcesDuringImport } from "actions/datasourceActions";
import { fetchPlugins } from "actions/pluginActions";
import {
  setIsReconnectingDatasourcesModalOpen,
  setWorkspaceIdForImport,
} from "@appsmith/actions/applicationActions";
import { EvalWorker } from "sagas/EvaluationsSaga";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";

interface CreatePackageSagaProps {
  workspaceId: string;
  name?: string;
  icon?: string;
  color?: string;
}

interface ShowReconnectModalProps {
  package: ImportPackageResponse["package"];
  unConfiguredDatasourceList: ImportPackageResponse["unConfiguredDatasourceList"];
}

export interface FetchPackagesForWorkspacePayload {
  workspaceId: string;
}

export function* fetchPackagesForWorkspaceSaga(
  action: ReduxAction<FetchPackagesForWorkspacePayload>,
) {
  try {
    const showQueryModule: boolean = yield select(getShowQueryModule);
    if (showQueryModule) {
      const response: ApiResponse = yield call(
        PackageApi.fetchPackagesByWorkspace,
        action.payload,
      );
      const isValidResponse: boolean = yield validateResponse(response);

      if (isValidResponse) {
        yield put({
          type: ReduxActionTypes.FETCH_PACKAGES_FOR_WORKSPACE_SUCCESS,
          payload: response.data,
        });
      }
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_PACKAGES_FOR_WORKSPACE_SUCCESS,
        payload: [],
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PACKAGES_FOR_WORKSPACE_ERROR,
      payload: { error: { message: createMessage(FETCH_PACKAGES_ERROR) } },
    });
  }
}

export function* fetchConsumablePackagesInWorkspaceSaga(
  action: ReduxAction<FetchConsumablePackagesInWorkspacePayload>,
) {
  try {
    const response: ApiResponse = yield call(
      PackageApi.fetchConsumablePackagesInWorkspace,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_ERROR,
      payload: { error: { message: createMessage(FETCH_PACKAGES_ERROR) } },
    });
  }
}

/**
 * Saga creates a package and specifically should be called from workspace
 */
export function* createPackageFromWorkspaceSaga(
  action: ReduxAction<CreatePackageFromWorkspacePayload>,
) {
  try {
    const { workspaceId } = action.payload;

    const isFetchingPackagesList: boolean = yield select(getIsFetchingPackages);

    if (isFetchingPackagesList) return;

    const response: ApiResponse<Package> = yield call(createPackageSaga, {
      workspaceId,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const { id } = response.data;

      yield put({
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: response.data,
      });

      analytics.createPackage(response.data);

      history.push(`${BASE_PACKAGE_EDITOR_PATH}/${id}`);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR,
      payload: {
        error: {
          message: createMessage(CREATE_PACKAGE_ERROR),
        },
      },
    });
  }
}

/**
 * Creates a package based on the workspaceId provided. name, icon and color are optional, so if
 * they are not provided; the saga will auto generate them.
 * For name, the saga will will look into existing packages in the workspace and generate the next
 * possible name.
 *
 * @param payload - CreatePackageSagaProps
 *  {
      workspaceId: string;
      name?: string;
      icon?: string;
      color?: string;
    }
 * @returns
 */
export function* createPackageSaga(payload: CreatePackageSagaProps) {
  try {
    const packageList: PackageMetadata[] = yield select(getPackagesList);

    const name = (() => {
      if (payload.name) return payload.name;

      const currentWorkspacePackages = packageList
        .filter(({ workspaceId }) => workspaceId === payload.workspaceId)
        .map(({ name }) => name);

      return getNextEntityName(
        DEFAULT_PACKAGE_PREFIX,
        currentWorkspacePackages,
      );
    })();

    const body: CreatePackagePayload = {
      workspaceId: payload.workspaceId,
      name,
      icon: payload.icon || DEFAULT_PACKAGE_ICON,
      color: payload.color || DEFAULT_PACKAGE_COLOR,
    };

    const response: ApiResponse = yield call(PackageApi.createPackage, body);
    return response;
  } catch (error) {
    throw error;
  }
}

export function* fetchPackageSaga(payload: FetchPackagePayload) {
  try {
    const response: ApiResponse<FetchPackageResponse> = yield call(
      PackageApi.fetchPackage,
      payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_PACKAGE_SUCCESS,
        payload: response.data,
      });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PACKAGE_ERROR,
      payload: {
        error: {
          message: createMessage(FETCH_PACKAGE_ERROR),
        },
      },
    });
  }
}

export function* updatePackageSaga(action: ReduxAction<Package>) {
  try {
    const packageData: Package = yield call(PackageApi.fetchPackage, {
      packageId: action.payload.id,
    });
    const response: ApiResponse<Package> = yield call(
      PackageApi.updatePackage,
      { ...packageData, ...action.payload },
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_PACKAGE_SUCCESS,
        payload: response.data,
      });

      analytics.updatePackage(response.data);

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_PACKAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deletePackageSaga(action: ReduxAction<DeletePackagePayload>) {
  try {
    const response: ApiResponse<Package> = yield call(
      PackageApi.deletePackage,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_PACKAGE_SUCCESS,
        payload: action.payload,
      });

      analytics.deletePackage(action.payload.id);

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_PACKAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* publishPackageSaga(
  action: ReduxAction<PublishPackagePayload>,
) {
  try {
    const response: ApiResponse<PublishPackagePayload> = yield call(
      PackageApi.publishPackage,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.PUBLISH_PACKAGE_SUCCESS,
        payload: response.data,
      });

      analytics.publishPackage(action.payload.packageId);

      toast.show("Package published successfully", { kind: "success" });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUBLISH_PACKAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* importPackageSaga(action: ReduxAction<ImportPackagePayload>) {
  try {
    const response: ApiResponse<ImportPackageResponse> = yield call(
      PackageApi.importPackage,
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const {
        isPartialImport,
        package: pkg,
        unConfiguredDatasourceList,
      } = response.data;

      yield put({
        type: ReduxActionTypes.IMPORT_PACKAGE_SUCCESS,
        payload: pkg,
      });

      if (isPartialImport) {
        yield call(showReconnectDatasourceModalSaga, {
          package: pkg,
          unConfiguredDatasourceList,
        });
      } else {
        if (!action.payload.packageId) {
          const packageUrl = `${BASE_PACKAGE_EDITOR_PATH}/${pkg.id}`;

          history.push(packageUrl);
        } else {
          yield call(fetchPackageSaga, {
            packageId: pkg.id,
          });
        }

        toast.show("Package imported successfully", {
          kind: "success",
        });
      }
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_PACKAGE_ERROR,
      payload: {
        error: createMessage(ERROR_IMPORT_PACKAGE),
      },
    });
  }
}

export function* showReconnectDatasourceModalSaga(
  props: ShowReconnectModalProps,
) {
  const { package: pkg, unConfiguredDatasourceList } = props;
  const { workspaceId } = pkg;

  yield put(fetchPlugins({ workspaceId }));
  yield put(
    setUnconfiguredDatasourcesDuringImport(unConfiguredDatasourceList || []),
  );
  yield put(setWorkspaceIdForImport({ editorId: pkg.id, workspaceId }));
  yield put(setIsReconnectingDatasourcesModalOpen({ isOpen: true }));
}

/**
 * For now this saga only supports initializing default js libs provided by the platform
 */
export function* fetchJSLibrariesSaga() {
  yield call(EvalWorker.request, EVAL_WORKER_ACTIONS.LOAD_LIBRARIES);
}

export default function* packagesSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_PACKAGES_FOR_WORKSPACE_INIT,
      fetchPackagesForWorkspaceSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_INIT,
      fetchConsumablePackagesInWorkspaceSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
      createPackageFromWorkspaceSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_PACKAGE_INIT, updatePackageSaga),
    takeLatest(ReduxActionTypes.DELETE_PACKAGE_INIT, deletePackageSaga),
    takeLatest(ReduxActionTypes.PUBLISH_PACKAGE_INIT, publishPackageSaga),
    takeLatest(ReduxActionTypes.IMPORT_PACKAGE_INIT, importPackageSaga),
    takeLatest(
      ReduxActionTypes.FETCH_JS_LIBRARIES_FOR_PKG_INIT,
      fetchJSLibrariesSaga,
    ),
  ]);
}
