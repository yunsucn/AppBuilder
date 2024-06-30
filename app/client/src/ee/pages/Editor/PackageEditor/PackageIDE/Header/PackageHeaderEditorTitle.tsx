import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "design-system";

import { createMessage, MODULES_TITLE } from "@appsmith/constants/messages";
import { IDEHeaderEditorSwitcher } from "IDE";
import ModulesSection from "./ModulesSection";

const PackageHeaderEditorTitle = ({ title }: { title: string }) => {
  const [active, setActive] = useState(false);

  const closeMenu = () => {
    setActive(false);
  };

  return (
    <Popover onOpenChange={setActive} open={active}>
      <PopoverTrigger>
        <IDEHeaderEditorSwitcher
          active={active}
          prefix={createMessage(MODULES_TITLE)}
          title={title}
          titleTestId="t-modules-switcher"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="!p-0 !pb-1"
        onEscapeKeyDown={closeMenu}
      >
        <ModulesSection onItemSelected={closeMenu} />
      </PopoverContent>
    </Popover>
  );
};

export default PackageHeaderEditorTitle;
