import { getAoTokens } from "~tokens";
import { ExtensionStorage } from "./storage";

// export const AO_NATIVE_TOKEN = "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w";
export const AO_NATIVE_TOKEN = "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc";
export const EXP_TOKEN = "aYrCboXVSl1AXL9gPFe3tfRxRf0ZmkOXH65mKT0HHZw";
export const AO_NATIVE_TOKEN_BALANCE_MIRROR =
  "Pi-WmAQp2-mh-oWH9lWpz5EthlUDj_W0IusAv-RXhRk";
// export const AO_NATIVE_OLD_TOKEN =
//   "BJj8sNao3XPqsoJnea4DnJyPzHnKhkhcY1HtWBxHcLs";
export const AO_NATIVE_OLD_TOKEN =
  "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w";

export const AO_NATIVE_TOKEN_INFO = {
  Name: "AO",
  Ticker: "AO",
  Denomination: 12,
  Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
  processId: AO_NATIVE_TOKEN
};

export async function updateAoToken() {
  try {
    const aoTokens = await getAoTokens();
    const updatedAoTokens = aoTokens.filter(
      (token) => token.processId !== AO_NATIVE_OLD_TOKEN
    );
    const isAoTokenPresent = updatedAoTokens.some(
      (token) => token.processId === AO_NATIVE_TOKEN
    );
    if (!isAoTokenPresent) {
      updatedAoTokens.unshift(AO_NATIVE_TOKEN_INFO);
    }
    await ExtensionStorage.set("ao_tokens", updatedAoTokens);
  } catch (e) {
    console.log(`Error updating old ao token with new ao token: ${e}`);
  }
}
