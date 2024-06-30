export * from "ce/components/editorComponents/Debugger/ErrorLogs/getLogIconForEntity";
import React from "react";
import type { IconEntityMapper } from "ce/components/editorComponents/Debugger/ErrorLogs/getLogIconForEntity";
import { getIconForEntity as CE_getIconForEntity } from "ce/components/editorComponents/Debugger/ErrorLogs/getLogIconForEntity";
import { importRemixIcon } from "@design-system/widgets-old";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import { getModuleIcon } from "pages/Editor/utils";
import { useSelector } from "react-redux";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";

const GuideLineIcon = importRemixIcon(
  async () => import("remixicon-react/GuideLineIcon"),
);

export const getIconForEntity: IconEntityMapper = {
  ...CE_getIconForEntity,
  [ENTITY_TYPE.MODULE_INPUT]: () => {
    return <GuideLineIcon />;
  },
  [ENTITY_TYPE.MODULE_INSTANCE]: (props) => {
    const moduleInstance = useSelector((state) =>
      getModuleInstanceById(state, props.id || ""),
    );
    const module = useSelector((state) =>
      getModuleById(state, moduleInstance?.sourceModuleId || ""),
    );
    return getModuleIcon(module, props.pluginImages) || null;
  },
};
