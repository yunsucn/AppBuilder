import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import Header from "../common/Header";
import Body from "../common/Body";
import Container from "../common/Container";
import {
  getIsJSModuleInstanceActionExecuting,
  getModuleInstanceActiveJSActionId,
  getModuleInstanceById,
  getModuleInstancePublicJSCollectionData,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import {
  setModuleInstanceActiveJSAction,
  updateModuleInstanceOnPageLoadSettings,
  updateModuleInstanceSettings,
} from "@appsmith/actions/moduleInstanceActions";
import Loader from "../../ModuleEditor/Loader";
import {
  hasExecuteModuleInstancePermission,
  hasManageModuleInstancePermission,
} from "@appsmith/utils/permissionHelpers";
import type { OnUpdateSettingsProps } from "pages/Editor/JSEditor/JSFunctionSettings";
import JSFunctionSettingsView, {
  SettingColumn,
} from "pages/Editor/JSEditor/JSFunctionSettings";
import { isEmpty, set, sortBy } from "lodash";
import { klona } from "klona";
import JSResponseView from "components/editorComponents/JSResponseView";
import type { JSAction } from "entities/JSCollection";
import type { AppState } from "@appsmith/reducers";
import equal from "fast-deep-equal/es6";
import { getJSCollectionParseErrors } from "@appsmith/selectors/entitiesSelector";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { JSFunctionRun } from "pages/Editor/JSEditor/JSFunctionRun";
import type { JSActionDropdownOption } from "pages/Editor/JSEditor/utils";
import {
  convertJSActionsToDropdownOptions,
  getActionFromJsCollection,
  getJSActionOption,
} from "pages/Editor/JSEditor/utils";
import type { DropdownOnSelect } from "design-system-old";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { startExecutingJSFunction } from "actions/jsPaneActions";
import styled from "styled-components";
import { Text } from "design-system";
import { extractFunctionParams } from "./utils";
import { getPackageById } from "@appsmith/selectors/packageSelectors";
import MissingModule from "../common/MissingModule";

export interface JSModuleInstanceEditorProps {
  moduleInstanceId: string;
}

const StyledJSFunctionRunWrapper = styled.div`
  .ads-v2-select {
    background-color: white;
  }
`;

const additionalHeadings = [
  {
    text: "Parameters",
    hasInfo: true,
    info: "List of params in the function definition",
    key: "params",
    hidden: undefined,
  },
];

function JSModuleInstanceEditor({
  moduleInstanceId,
}: JSModuleInstanceEditorProps) {
  const dispatch = useDispatch();

  const moduleInstance = useSelector((state) =>
    getModuleInstanceById(state, moduleInstanceId),
  );
  const module = useSelector((state) =>
    getModuleById(state, moduleInstance?.sourceModuleId || ""),
  );
  const pkg = useSelector((state) =>
    getPackageById(state, module?.packageId || ""),
  );
  const publicJSCollectionData = useSelector((state) =>
    getModuleInstancePublicJSCollectionData(state, moduleInstanceId),
  );
  const publicJSCollection = publicJSCollectionData?.config;
  const parseErrors = useSelector(
    (state: AppState) =>
      getJSCollectionParseErrors(state, publicJSCollection?.name || ""),
    equal,
  );
  const activeJSActionId = useSelector((state: AppState) =>
    getModuleInstanceActiveJSActionId(state, publicJSCollection?.id || ""),
  );
  const isExecutingCurrentJSAction = useSelector((state: AppState) =>
    getIsJSModuleInstanceActionExecuting(
      state,
      moduleInstanceId,
      activeJSActionId,
    ),
  );
  const hasMissingModule = Boolean(moduleInstance?.invalids?.length);
  const activeJSAction = publicJSCollection
    ? getActionFromJsCollection(activeJSActionId, publicJSCollection)
    : null;

  const sortedJSactions = sortBy(publicJSCollection?.actions, ["name"]);

  const activJSActionOption = getJSActionOption(
    activeJSAction,
    sortedJSactions,
  ) as JSActionDropdownOption;

  const lastExecutedJSAction = publicJSCollection
    ? getActionFromJsCollection(
        publicJSCollectionData?.lastExecutedActionId || null,
        publicJSCollection,
      )
    : null;

  const isExecutePermitted = hasExecuteModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

  const canManageModuleInstance = hasManageModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

  const renderParamsColumns = useCallback(
    (action: JSAction, headingCount: number) => {
      const actionBody = action.actionConfiguration.body;
      const params = actionBody && extractFunctionParams(actionBody);
      if (params) {
        return (
          <SettingColumn headingCount={headingCount}>
            <Text>{params.join(", ")}</Text>
          </SettingColumn>
        );
      }
    },
    [publicJSCollection],
  );

  if (
    !moduleInstance ||
    (!hasMissingModule && (!module || !publicJSCollection))
  ) {
    return <Loader />;
  }

  const onUpdateSettings = (props: OnUpdateSettingsProps) => {
    if (!publicJSCollection) return;

    if (
      props.propertyName === "executeOnLoad" &&
      typeof props.value === "boolean"
    ) {
      dispatch(
        updateModuleInstanceOnPageLoadSettings({
          actionId: props.action.id,
          value: props.value,
        }),
      );
    } else {
      const updatedJSCollection = klona(publicJSCollection);
      const updatedAction = klona(props.action);

      set(updatedAction, props.propertyName, props.value);

      updatedJSCollection.actions = updatedJSCollection.actions.map((a) => {
        return a.id === updatedAction.id ? updatedAction : a;
      });

      dispatch(updateModuleInstanceSettings(updatedJSCollection));
    }
  };

  const handleJSActionOptionSelection: DropdownOnSelect = (value) => {
    if (value && publicJSCollection) {
      const jsAction = getActionFromJsCollection(value, publicJSCollection);
      if (jsAction) {
        dispatch(
          setModuleInstanceActiveJSAction({
            jsCollectionId: publicJSCollection.id,
            jsActionId: jsAction.id,
          }),
        );
      }
    }
  };

  const handleRunAction = (
    event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
    from: EventLocation,
  ) => {
    event.preventDefault();
    if (
      publicJSCollection &&
      !disableRunFunctionality &&
      !isExecutingCurrentJSAction &&
      activJSActionOption?.data
    ) {
      const jsAction = activJSActionOption.data;
      if (jsAction.id !== activJSActionOption.data?.id)
        dispatch(
          setModuleInstanceActiveJSAction({
            jsCollectionId: publicJSCollection.id,
            jsActionId: jsAction.id,
          }),
        );
      dispatch(
        startExecutingJSFunction({
          action: jsAction,
          collection: publicJSCollection,
          from: from,
          openDebugger: true,
        }),
      );
    }
  };

  const disableRunFunctionality = Boolean(
    parseErrors.length || isEmpty(sortedJSactions),
  );

  return (
    <Container data-testid="t--module-instance-js-editor">
      <Header
        isDisabled={hasMissingModule}
        moduleId={module?.originModuleId}
        moduleInstance={moduleInstance}
        packageId={pkg?.originPackageId}
      >
        {!hasMissingModule && publicJSCollection && (
          <StyledJSFunctionRunWrapper>
            <JSFunctionRun
              disabled={disableRunFunctionality || !isExecutePermitted}
              isLoading={isExecutingCurrentJSAction}
              jsCollection={publicJSCollection}
              onButtonClick={(
                event:
                  | React.MouseEvent<HTMLElement, MouseEvent>
                  | KeyboardEvent,
              ) => {
                handleRunAction(event, "JS_OBJECT_MAIN_RUN_BUTTON");
              }}
              onSelect={handleJSActionOptionSelection}
              options={convertJSActionsToDropdownOptions(sortedJSactions)}
              selected={activJSActionOption}
              showTooltip={!activJSActionOption.data}
            />
          </StyledJSFunctionRunWrapper>
        )}
      </Header>
      <Body>
        {hasMissingModule && <MissingModule moduleInstance={moduleInstance} />}
        {!hasMissingModule && (
          <JSFunctionSettingsView
            actions={sortedJSactions}
            additionalHeadings={additionalHeadings}
            disabled={!canManageModuleInstance}
            onUpdateSettings={onUpdateSettings}
            renderAdditionalColumns={renderParamsColumns}
          />
        )}
      </Body>
      <JSResponseView
        currentFunction={lastExecutedJSAction}
        disabled={disableRunFunctionality || !isExecutePermitted}
        errors={parseErrors}
        isLoading={isExecutingCurrentJSAction}
        jsCollectionData={publicJSCollectionData}
        onButtonClick={(
          event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
        ) => {
          handleRunAction(event, "JS_OBJECT_RESPONSE_RUN_BUTTON");
        }}
        theme={EditorTheme.LIGHT}
      />
    </Container>
  );
}

export default JSModuleInstanceEditor;
