import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { removeApp } from "~applications";
import { createContextMenus } from "~utils/context_menus";
import { updateIcon } from "~utils/icon";

const background: BackgroundModuleFunction<void> = async (appData) => {
  // remove app
  await removeApp(appData.url);

  // remove connected icon
  await updateIcon(false);
  createContextMenus(false);
};

export default background;
