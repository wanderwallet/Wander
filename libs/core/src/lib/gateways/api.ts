import type GQLResultInterface from "ar-gql/dist/faces";
import { concatGatewayURL } from "./utils";
import { findGateway } from "./wayfinder";
import { type Gateway } from "./gateway";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import { retryWithDelay } from "../utils/promises/retry";

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

export async function gqlAll(query: string, variables?: Record<string, unknown>, gateway?: Gateway) {
  let hasNextPage = true;
  let edges: GQLEdgeInterface[] = [];
  let cursor = "";

  while (hasNextPage) {
    try {
      const res = await retryWithDelay(() => gql(query, { ...variables, after: cursor }, gateway), 2);
      const transactions = res.data.transactions;

      if (transactions.edges && transactions.edges.length) {
        edges = edges.concat(transactions.edges);
        cursor = transactions.edges[transactions.edges.length - 1].cursor;
      }
      hasNextPage = transactions.pageInfo.hasNextPage;
    } catch (error) {
      console.error("Error fetching gqlAll: ", error);
      return edges;
    }
  }

  return edges;
}
