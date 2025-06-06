import { AO_PROCESS_ID } from "~tokens/aoTokens/ao";
import { AO_MINTER_PROCESS_ID } from "./constants";

export const SWAP_SUCCESS_QUERY_WITH_CURSOR = `
query ($agentId: String!, $after: String) {
  transactions(
    first: 10,
    after: $after,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Swap-Success"]},
      {name: "From-Process", values: [$agentId]}
    ]
  ) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}
`;

export const AOS_QUERY = `query ($owners: [String!]!, $names: [String!]!) {
    transactions(
      first: 1,
      owners: $owners,
      tags: [
        { name: "Data-Protocol", values: ["ao"] },
        { name: "Type", values: ["Process"]},
        { name: "Name", values: $names}
      ]
    ) {
      edges {
        node {
          id
        }
      }
    }
  }`;

export const TRANSACTION_QUERY = `query ($ids: [ID!]!) {
  transactions(ids: $ids) {
    edges {
      node {
        id
      }
    }
  }
}`;

export const AO_PROCESS_MINT_QUERY = `
query {
  transactions(
    first: 10,
    recipients: ["${AO_PROCESS_ID}"],
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Mint"]},
      {name: "From-Process", values: ["${AO_MINTER_PROCESS_ID}"]},
      {name: "Index", values: ["1"]}
    ]
  ) {
    edges {
      node {
        id
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}
`;

export const AO_PROCESS_MINT_WITH_NONCE_QUERY = `
query ($nonce: String!) {
  transactions(
    first: 30,
    recipients: ["${AO_PROCESS_ID}"],
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Mint"]},
      {name: "From-Process", values: ["${AO_MINTER_PROCESS_ID}"]},
      {name: "Nonce", values: [$nonce]}
    ]
  ) {
    edges {
      node {
        id
        block { timestamp, height }
      }
    }
  }
}
`;
