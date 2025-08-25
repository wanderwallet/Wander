import type Application from "./application";
import { concatGatewayURL } from "../gateways/utils";

/**
 * Get the full gateway URL string, from the
 * extension storage. This should only be used
 * for background scripts, not for the UX.
 * The UX should use the redux gateway config
 * reducer and concat the gateway URL from there.
 *
 * @returns Gateway URL
 */
export async function gatewayURL(app: Application) {
  const gatewayConfig = await app.getGatewayConfig();

  return concatGatewayURL(gatewayConfig);
}
