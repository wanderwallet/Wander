import { injectWanderWalletAPI } from "~api/foreground/foreground-setup-wallet-sdk";
import { log, LOG_GROUP } from "~utils/log/log.utils";

log(LOG_GROUP.SETUP, "injected/setup-wallet-sdk.injected-script.ts");

injectWanderWalletAPI();
