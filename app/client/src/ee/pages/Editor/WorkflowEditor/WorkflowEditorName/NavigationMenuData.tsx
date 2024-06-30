import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import type { noop } from "lodash";
import { APPLICATIONS_URL } from "constants/routes";
import { hasDeleteWorkflowPermission } from "@appsmith/utils/permissionHelpers";
import { Colors } from "constants/Colors";
import { toast } from "design-system";
import type { ThemeProp } from "WidgetProvider/constants";
import { DISCORD_URL, DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import type { MenuItemData } from "pages/Editor/EditorName/NavigationMenuItem";
import { MenuTypes } from "pages/Editor/EditorName/types";
import { getCurrentWorkflow } from "@appsmith/selectors/workflowSelectors";
import { deleteWorkflow } from "@appsmith/actions/workflowActions";

export interface NavigationMenuDataProps extends ThemeProp {
  editMode: typeof noop;
}

export const GetNavigationMenuData = ({
  editMode,
}: NavigationMenuDataProps): MenuItemData[] => {
  const dispatch = useDispatch();
  const history = useHistory();

  const currentWorkflow = useSelector(getCurrentWorkflow);
  const workflowId = currentWorkflow?.id;
  const isworkflowIdPresent = !!(workflowId && workflowId.length > 0);

  const openExternalLink = (link: string) => {
    if (link) {
      window.open(link, "_blank");
    }
  };

  const deleteWorkflowHandler = () => {
    if (workflowId && workflowId.length > 0) {
      dispatch(deleteWorkflow({ id: workflowId }));
      history.push(APPLICATIONS_URL);
    } else {
      toast.show("Error while deleting Workflow", {
        kind: "error",
      });
    }
  };

  return [
    {
      text: "Home",
      onClick: () => history.replace(APPLICATIONS_URL),
      type: MenuTypes.MENU,
      isVisible: true,
    },
    {
      text: "divider_1",
      type: MenuTypes.MENU_DIVIDER,
      isVisible: true,
    },
    {
      text: "Edit name",
      onClick: editMode,
      type: MenuTypes.MENU,
      isVisible: true,
    },
    {
      text: "Help",
      type: MenuTypes.PARENT,
      isVisible: true,
      children: [
        {
          text: "Community forum",
          onClick: () => openExternalLink("https://community.appsmith.com/"),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Discord channel",
          onClick: () => openExternalLink(DISCORD_URL),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Github",
          onClick: () =>
            openExternalLink("https://github.com/appsmithorg/appsmith/"),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Documentation",
          onClick: () => openExternalLink(DOCS_BASE_URL),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
      ],
    },
    hasDeleteWorkflowPermission(currentWorkflow?.userPermissions) && {
      text: "Delete workflow",
      confirmText: "Are you sure?",
      onClick: deleteWorkflowHandler,
      type: MenuTypes.RECONFIRM,
      isVisible: isworkflowIdPresent,
      style: { color: Colors.ERROR_RED },
    },
  ].filter(Boolean) as MenuItemData[];
};
