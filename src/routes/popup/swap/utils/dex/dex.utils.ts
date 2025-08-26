import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import type { Message } from "postcss";
import { gql } from "~gateways/api";
import type { AoMessage } from "./dex.types";
import { retryWithDelay } from "~utils/promises/retry";
import {
  BOTEGA_SWAP_CONFIRMATION_QUERY_WITH_CURSOR,
  PERMASWAP_SWAP_CONFIRMATION_QUERY,
  PERMASWAP_SWAP_QUERY_WITH_CURSOR,
  SWAP_TRANSFER_QUERY,
} from "./dex.constants";
import { getTagValue } from "~tokens/aoTokens/ao";
import { parseSwapTransaction, validateGqlResponse } from "../swap.utils";
import { goldskyGateway } from "~gateways/gateway";

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export const linkedMessagesQuery = (includeCount = false) => `
query($messageId: String!, $limit: Int!, $sortOrder: SortOrder!, $cursor: String) {
  transactions(
    sort: $sortOrder
    first: $limit
    after: $cursor
    tags: [
      { name: "Pushed-For", values: [$messageId] }
      { name: "Data-Protocol", values: ["ao"] }
    ]
  ) {
    ${includeCount ? "count" : ""}
    ...MessageFields
  }
}
fragment MessageFields on TransactionConnection {
  pageInfo { hasNextPage }
  edges {
    cursor
    node {
      id
      ingested_at
      recipient
      block { timestamp height }
      tags { name value }
      data { size }
      owner { address }
    }
  }
}
`;

export const systemTagNames = [
  "Type",
  "Data-Protocol",
  "SDK",
  "Content-Type",
  "Variant",
  "Pushed-For",
  "Ref_",
  "Reference",
  "From-Module",
  "From-Process",
  "Module",
  "Scheduler",
  "aos-Version",
  "App-Name",
  "Scheduler",
  "Name",
];

export function parseAoMessage(edge: GQLEdgeInterface): AoMessage {
  const { node, cursor } = edge;

  const systemTags: Record<string, string> = {};
  const userTags: Record<string, string> = {};
  const tags: Record<string, string> = {};

  node.tags.forEach((tag) => {
    tags[tag.name] = tag.value;

    if (systemTagNames.includes(tag.name)) {
      systemTags[tag.name] = tag.value;
    } else {
      userTags[tag.name] = tag.value;
    }
  });

  // delete systemTags["Pushed-For"]
  // delete systemTags["Data-Protocol"]
  delete systemTags["Type"];
  delete systemTags["Module"];
  delete systemTags["Name"];

  const type = tags["Type"];
  const blockHeight = node.block ? node.block.height : null;
  const from = tags["Forwarded-For"] || tags["From-Process"] || node.owner.address;
  const schedulerId = tags["Scheduler"];
  const action = tags["Action"];
  const blockTimestamp = node.block ? new Date(node.block.timestamp * 1000) : null;
  // const ingestedAt = new Date(node.ingested_at * 1000);
  const to = node.recipient.trim();

  if (type === "Message" && tags["Name"]) {
    userTags["Name"] = tags["Name"];
  }

  return {
    id: node.id,
    type,
    from,
    to,
    blockHeight,
    schedulerId,
    blockTimestamp,
    // ingestedAt,
    action,
    tags,
    systemTags,
    userTags,
    cursor,
    dataSize: node.data?.size,
  };
}

export function parseAoMessageFromCU(message: Message) {
  const systemTags: Record<string, string> = {};
  const userTags: Record<string, string> = {};
  const tags: Record<string, string> = {};

  message.Tags.forEach((tag) => {
    tags[tag.name] = tag.value;

    if (systemTagNames.includes(tag.name)) {
      systemTags[tag.name] = tag.value;
    } else {
      userTags[tag.name] = tag.value;
    }
  });

  // delete systemTags["Pushed-For"]
  // delete systemTags["Data-Protocol"]
  delete systemTags["Type"];
  delete systemTags["Module"];
  delete systemTags["Name"];

  return {
    systemTags,
    userTags,
    tags,
  };
}

export async function getLinkedMessages(
  limit = 100,
  cursor = "",
  ascending: boolean,
  pushedFor: string,
): Promise<AoMessage[]> {
  try {
    const result = await gql(linkedMessagesQuery(!cursor), {
      limit,
      sortOrder: ascending ? "HEIGHT_ASC" : "INGESTED_AT_DESC",
      cursor,
      messageId: pushedFor,
    });

    const { data } = result;

    if (!data) return [];

    const { edges } = data.transactions;
    const events = edges.map(parseAoMessage);

    return events;
  } catch (error) {
    return [];
  }
}

export async function getBotegaTransactions(address: string, cursor = "") {
  const result = await retryWithDelay(async () => {
    const data = await gql(BOTEGA_SWAP_CONFIRMATION_QUERY_WITH_CURSOR, { address, after: cursor }, goldskyGateway);

    // validate the response
    validateGqlResponse(data);

    const edges = data?.data?.transactions?.edges || [];
    if (edges.length === 0) return { txs: [], hasNextPage: false, cursor };

    cursor = edges[edges.length - 1].cursor;
    const hasNextPage = data?.data?.transactions?.pageInfo?.hasNextPage || false;

    let successfulTxs = [];
    let failedTxs = [];

    for (const edge of edges) {
      const tags = edge.node.tags || [];
      const action = getTagValue("Action", tags);
      if (action === "Order-Confirmation") {
        successfulTxs.push(edge);
      } else {
        failedTxs.push(edge);
      }
    }

    if (failedTxs.length > 0) {
      const pushedFors = failedTxs.map((e) => e.node.id);
      const swapTransferResult = await retryWithDelay(async () => {
        const data = await gql(SWAP_TRANSFER_QUERY, { address, pushedFors }, goldskyGateway);

        // validate the response
        validateGqlResponse(data);

        return data;
      }, 2);

      const swapTransferTxs = swapTransferResult?.data?.transactions?.edges || [];
      const allTxs = [...successfulTxs, ...swapTransferTxs];
      return { txs: allTxs.map(parseSwapTransaction), hasNextPage, cursor };
    }

    return { txs: successfulTxs.map(parseSwapTransaction), hasNextPage, cursor };
  }, 2);

  return result;
}

export async function getPermaswapTransactions(address: string, cursor = "") {
  const result = await retryWithDelay(async () => {
    const data = await gql(PERMASWAP_SWAP_QUERY_WITH_CURSOR, { address, after: cursor }, goldskyGateway);

    // validate the response
    validateGqlResponse(data);

    const edges = data?.data?.transactions?.edges || [];
    if (edges.length === 0) return { txs: [], hasNextPage: false, cursor };

    cursor = edges[edges.length - 1].cursor;
    const hasNextPage = data?.data?.transactions?.pageInfo?.hasNextPage || false;

    const txMap = new Map<string, GQLEdgeInterface>();

    for (const edge of edges) {
      txMap.set(edge.node.id, edge);
    }

    const pushedFors = Array.from(txMap.keys());
    const orderNoticesResult = await retryWithDelay(async () => {
      const data = await gql(PERMASWAP_SWAP_CONFIRMATION_QUERY, { address, pushedFors }, goldskyGateway);

      // validate the response
      validateGqlResponse(data);

      const edges = data?.data?.transactions?.edges || [];
      for (const edge of edges) {
        const tags = edge?.node?.tags || [];
        const pushedFor = getTagValue("Pushed-For", tags);
        const swapTx = txMap.get(pushedFor);
        if (swapTx) {
          edge.node.tags.push(...swapTx.node.tags);
        }
      }

      return edges;
    }, 2);

    return { txs: orderNoticesResult.map(parseSwapTransaction), hasNextPage, cursor };
  }, 2);

  return result;
}
