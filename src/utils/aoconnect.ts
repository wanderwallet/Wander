import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";

const ARDRIVE_CU_URL = "https://cu.ardrive.io";
const WNDR_CU_URL = "https://gateway.ar";
export const DATAITEM_SIGNER_KIND = "ans104";
export const HTTP_SIGNER_KIND = "httpsig";

export const aoInstance = connect(defaultConfig);
export const wndrAoInstance = connect({ CU_URL: WNDR_CU_URL });
export const ardriveAoInstance = connect({ CU_URL: ARDRIVE_CU_URL });
