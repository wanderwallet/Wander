export const DEX_SWAP_QUERY_WITH_CURSOR = `
query($address: String!, $provider: String!, $after: String) {
  transactions(
    first: 10,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Transfer"]},
      { name: "X-Client", values: ["Wander"]},
      { name: "X-Type", values: ["Swap"]},
      { name: "X-Provider", values: [$provider] },
    ],
    sort: INGESTED_AT_DESC,
    owners: [$address],
    after: $after
  ) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const BOTEGA_SWAP_CONFIRMATION_QUERY = `
query($address: String!, $pushedFors: [String!]!) {
  transactions(
    first: 100,
    tags: [
      { name: "Data-Protocol", values: ["ao"]},
      { name: "Action", values: ["Order-Confirmation", "Order-Error"]},
      { name: "X-Client", values: ["Wander"]},
      { name: "X-Type", values: ["Swap"]},
      { name: "Relay-To", values: [$address] },
      { name: "Pushed-For", values: $pushedFors },
    ],
  ) {
    edges {
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const PERMASWAP_SWAP_CONFIRMATION_QUERY = `
query($address: String!, $pushedFors: [String!]!) {
  transactions(
    first: 10,
    tags: [
      { name: "Data-Protocol", values: ["ao"] },
      { name: "Action", values: ["Order-Notice"] },
      { name: "User", values: [$address] },
      { name: "Pushed-For", values: $pushedFors },
    ],
  ) {
    edges {
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const SWAP_TX_QUERY = `
query($txId: ID!) {
  transactions(
    first: 1,
    tags: [
      { name: "X-Client", values: ["Wander"]},
      { name: "X-Type", values: ["Swap"]},
    ],
    ids: [$txId],
  ) {
    edges {
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const SWAP_TX_AO_QUERY = `
query($txId: ID!) {
  transactions(
    first: 1,
    tags: [
      { name: "Data-Protocol", values: ["ao"] },
      { name: "X-Client", values: ["Wander"]},
      { name: "X-Type", values: ["Swap"]},
    ],
    ids: [$txId],
  ) {
    edges {
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const SWAP_CONFIRMATION_QUERY = `
query($pushedFor: String!) {
  transactions(
    first: 1,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Order-Confirmation", "Order-Error", "Order-Notice"]},
      { name: "Pushed-For", values: [$pushedFor] }
    ],
  ) {
    edges {
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const SWAP_TXS_QUERY = `
query($txIds: [ID!]!) {
  transactions(
    ids: $txIds,
    tags: [
      { name: "X-Client", values: ["Wander"]},
      { name: "X-Type", values: ["Swap"]},
    ],
    first: 10,
  ) {
    edges {
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const VENTO_SWAP_QUERY_WITH_CURSOR = `
query($address: String!, $after: String) {
  transactions(
    first: 10,
    tags: [
      { name: "X-Client", values: ["Wander"]},
      { name: "X-Type", values: ["Swap"]},
      { name: "X-Provider", values: ["Vento"] },
    ],
    sort: INGESTED_AT_DESC,
    owners: [$address],
    after: $after
  ) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const VENTO_BURN_DEBIT_NOTICE_QUERY = `
query($pushedFors: [String!]!) {
  transactions(
    first: 10,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Debit-Notice"]},
      { name: "Pushed-For", values: $pushedFors }
    ],
  ) {
    edges {
      node {
        id
        ingested_at
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;
