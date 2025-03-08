import { defaultGateway, type Gateway } from "~gateways/gateway";
import { findGateway } from "./wayfinder";

/**
 * Get the full gateway URL string, from the
 * provided gateway config.
 * This should be used for the UX, with the
 * redux gateway config reducer.
 */

export const concatGatewayURL = (gatewayConfig: Gateway) =>
  `${gatewayConfig.protocol}://${gatewayConfig.host}:${gatewayConfig.port}`;
/**
 * Convert URL string to a Gateway config object
 *
 * @param url URL to convert
 */

export function urlToGateway(url: string): Gateway {
  const gatewayURL = new URL(url);

  return {
    host: gatewayURL.hostname,
    port: gatewayURL.port === "" ? 443 : Number(gatewayURL.port),
    protocol: gatewayURL.protocol?.replace(":", "") || "http"
  };
}
/**
 * Compare two gateway objects
 *
 * @returns Same or not
 */

export function compareGateways(
  first: Partial<Gateway>,
  second: Partial<Gateway>
) {
  // compare the count of keys each object has
  if (Object.keys(first).length !== Object.keys(second).length) {
    return false;
  }

  // deep equal object keys
  for (const key in first) {
    if (first[key] !== second[key]) {
      return false;
    }
  }

  return true;
}

export const getArweaveLink = async (txId: string) => {
  let gateway: Gateway;
  try {
    gateway = await findGateway({});
  } catch {
    gateway = defaultGateway;
  }
  const url = concatGatewayURL(gateway);
  return `${url}/${txId}`;
};
