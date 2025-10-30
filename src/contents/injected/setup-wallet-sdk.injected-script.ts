import { injectWanderWalletAPI } from "~api/foreground/foreground-setup-wallet-sdk";
import { log, LOG_GROUP } from "~utils/log/log.utils";

log(LOG_GROUP.SETUP, "injected/setup-wallet-sdk.injected-script.ts");

// Added as a fix for arweave-storage-sdk issue in development mode where process.version is undefined:
if (process.env.NODE_ENV === "development" && import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") {
  const wp = (window as any).process;
  if (wp && typeof wp === "object" && wp.version === undefined) {
    wp.version = "";
  }
}

injectWanderWalletAPI();
