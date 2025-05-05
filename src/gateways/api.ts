import type GQLResultInterface from "ar-gql/dist/faces";
import { concatGatewayURL } from "./utils";
import { findGateway } from "./wayfinder";
import { type Gateway } from "./gateway";

/**
 * Run a query on the Arweave Graphql API,
 * using the configured gateway
 *
 * @param query The query string to run
 * @param variables GQL variables to pass
 *
 * @returns Query result
 */

export async function gql(query: string, variables?: Record<string, unknown>, gateway?: Gateway) {
  if (!gateway) {
    gateway = await findGateway({ graphql: true });
  }

  const gatewayUrl = concatGatewayURL(gateway);
  const graphql = JSON.stringify({
    query,
    variables,
  });

  // execute the query
  const data: GQLResultInterface = await (
    await fetch(gatewayUrl + "/graphql", {
      method: "post",
      body: graphql,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    })
  ).json();

  return data;
}
