import { type dryrun } from "@permaweb/aoconnect";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import type { Tag } from "arweave/web/lib/transaction";
import { gql } from "~gateways/api";

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export interface Message {
  Tags: Tag[];
}

export interface AoMessage {
  id: string;
  type: string;
  from: string;
  to: string;
  blockHeight: number;
  schedulerId: string;
  blockTimestamp: Date;
  action: string;
  tags: Record<string, string>;
  systemTags: Record<string, string>;
  userTags: Record<string, string>;
  cursor: string;
  dataSize: number;
}

export type DryRunResult = Awaited<ReturnType<typeof dryrun>>;

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
