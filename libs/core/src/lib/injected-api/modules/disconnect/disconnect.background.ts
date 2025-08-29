import { removeApp } from "../../../applications/application.utils";
import { createContextMenus } from "../../../utils/browser-extension/context-menus";
import { updateIcon } from "../../../utils/browser-extension/icon";
import type { BackgroundModuleFunction } from "../../background/background-modules";

const background: BackgroundModuleFunction<void> = async (appData) => {
  // remove app
  await removeApp(appData.url);

  // remove connected icon
  await updateIcon(false);
  createContextMenus(false);
};

export default background;
