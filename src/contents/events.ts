import type { PlasmoCSConfig } from "plasmo";
import { setupEventListeners } from "~api/foreground/foreground-setup-events";
import { log, LOG_GROUP } from "~utils/log/log.utils";

log(LOG_GROUP.SETUP, "events.content-script.ts");

export const config: PlasmoCSConfig = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  exclude_matches: ["*://reddit.com/*", "*://*.reddit.com/*"],
  run_at: "document_end",
  all_frames: true,
};

setupEventListeners();
