export * from "ce/sagas/PageSagas";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getFeatureFlagsForEngine,
  type DependentFeatureFlags,
} from "@appsmith/selectors/engineSelectors";
import type { FetchPageRequest, FetchPageResponse } from "api/PageApi";
import {
  fetchPageSaga,
  fetchPublishedPageSaga,
  saveLayoutSaga,
  createPageSaga,
  createNewPageFromEntity,
  clonePageSaga,
  updatePageSaga,
  deletePageSaga,
  savePageSaga,
  updateWidgetNameSaga,
  fetchAllPublishedPagesSaga,
  generateTemplatePageSaga,
  setPageOrderSaga,
  populatePageDSLsSaga,
  setCanvasCardsStateSaga,
  deleteCanvasCardsStateSaga,
  setPreviewModeInitSaga,
  refreshTheApp,
} from "ce/sagas/PageSagas";
import {
  all,
  call,
  debounce,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import { clearEvalCache } from "sagas/EvaluationsSaga";
import {
  setupModuleInstanceForViewSaga,
  setupModuleInstanceSaga,
} from "./moduleInstanceSagas";
import { fetchPage, fetchPublishedPage } from "actions/pageActions";

export function* setupPageSaga(action: ReduxAction<FetchPageRequest>) {
  try {
    const { id, isFirstLoad, pageWithMigratedDsl } = action.payload;
    const featureFlags: DependentFeatureFlags = yield select(
      getFeatureFlagsForEngine,
    );

    if (featureFlags.showQueryModule) {
      yield call(setupModuleInstanceSaga, {
        type: ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
        payload: {
          contextId: id,
          contextType: ModuleInstanceCreatorType.PAGE,
          viewMode: false,
        },
      });
    }

    /*
      Added the first line for isPageSwitching redux state to be true when page is being fetched to fix scroll position issue.
      Added the second line for sync call instead of async (due to first line) as it was leading to issue with on page load actions trigger.
    */
    yield put(fetchPage(id, isFirstLoad, pageWithMigratedDsl));
    yield take(ReduxActionTypes.FETCH_PAGE_SUCCESS);

    yield put({
      type: ReduxActionTypes.SETUP_PAGE_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* setupPublishedPageSaga(
  action: ReduxAction<{
    pageId: string;
    bustCache: boolean;
    firstLoad: boolean;
    pageWithMigratedDsl?: FetchPageResponse;
  }>,
) {
  try {
    const { bustCache, firstLoad, pageId, pageWithMigratedDsl } =
      action.payload;
    const featureFlags: DependentFeatureFlags = yield select(
      getFeatureFlagsForEngine,
    );

    if (featureFlags.showQueryModule) {
      yield call(setupModuleInstanceForViewSaga, {
        type: ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_INIT,
        payload: {
          contextId: pageId,
          contextType: ModuleInstanceCreatorType.PAGE,
          viewMode: true,
        },
      });
    }

    /*
      Added the first line for isPageSwitching redux state to be true when page is being fetched to fix scroll position issue.
      Added the second line for sync call instead of async (due to first line) as it was leading to issue with on page load actions trigger.
    */
    yield put(
      fetchPublishedPage(pageId, bustCache, firstLoad, pageWithMigratedDsl),
    );
    yield take(ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS);

    yield put({
      type: ReduxActionTypes.SETUP_PUBLISHED_PAGE_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_PUBLISHED_PAGE_ERROR,
      payload: { error },
    });
  }
}

export default function* pageSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_PAGE_INIT, fetchPageSaga),
    takeLatest(
      ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      fetchPublishedPageSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_LAYOUT, saveLayoutSaga),
    takeLeading(ReduxActionTypes.CREATE_PAGE_INIT, createPageSaga),
    takeLeading(
      ReduxActionTypes.CREATE_NEW_PAGE_FROM_ENTITIES,
      createNewPageFromEntity,
    ),
    takeLeading(ReduxActionTypes.CLONE_PAGE_INIT, clonePageSaga),
    takeLatest(ReduxActionTypes.UPDATE_PAGE_INIT, updatePageSaga),
    takeLatest(ReduxActionTypes.DELETE_PAGE_INIT, deletePageSaga),
    debounce(500, ReduxActionTypes.SAVE_PAGE_INIT, savePageSaga),
    takeLatest(ReduxActionTypes.UPDATE_WIDGET_NAME_INIT, updateWidgetNameSaga),
    takeLatest(
      ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
      fetchAllPublishedPagesSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_TEMPLATE_PAGE_INIT,
      generateTemplatePageSaga,
    ),
    takeLatest(ReduxActionTypes.SET_PAGE_ORDER_INIT, setPageOrderSaga),
    takeLatest(ReduxActionTypes.POPULATE_PAGEDSLS_INIT, populatePageDSLsSaga),
    takeEvery(ReduxActionTypes.SET_CANVAS_CARDS_STATE, setCanvasCardsStateSaga),
    takeEvery(
      ReduxActionTypes.DELETE_CANVAS_CARDS_STATE,
      deleteCanvasCardsStateSaga,
    ),
    takeEvery(ReduxActionTypes.SET_PREVIEW_MODE_INIT, setPreviewModeInitSaga),
    takeLatest(ReduxActionTypes.REFRESH_THE_APP, refreshTheApp),
    takeLatest(ReduxActionTypes.CLEAR_CACHE, clearEvalCache),
    takeLatest(ReduxActionTypes.SETUP_PAGE_INIT, setupPageSaga),
    takeLatest(
      ReduxActionTypes.SETUP_PUBLISHED_PAGE_INIT,
      setupPublishedPageSaga,
    ),
  ]);
}
