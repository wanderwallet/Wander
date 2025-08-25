export const PERMASWAP_SETTLES = [
  "IAcoo9WrT3CF-rhAxoYd0OFrzAgCLz3kWETQ4QdDLpw",
  "kiBTYw21tGxW60g3lGqKirI_d2JhTtXf4ExuLiVH2tc",
  "xN7xpox9Ti0ALf6x4egErPAW7ut60tDV1kTIoc0N86s",
  "a-AmhMGRNec4gvYTB071YIXYIggoJeaIoT7_mzuCGNg",
  "dtfFqoCHciHL4VtVnosUfz8bszKJjJc1ZsR1ddvgWi4",
  "YXlEJRD-JywfFwcd3lNQP7oVYZ2BB0cqlnjPIuOrgXY",
  "rKpOUxssKxgfXQOpaCq22npHno6oRw66L3kZeoo_Ndk",
];

export const PERMASWAP_ORDERBOOK = "rKpOUxssKxgfXQOpaCq22npHno6oRw66L3kZeoo_Ndk" as const;
export const BOTEGA_AMM_FACTORY = "3XBGLrygs11K63F_7mldWz4veNx6Llg6hI2yZs8LKHo" as const;

export const BOTEGA_SWAP_QUERY_WITH_CURSOR = `
query($address: String!, $after: String) {
  transactions(
    first: 10,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Order-Confirmation", "Order-Error"]},
      { name: "X-Client", values: ["Roam"]},
      { name: "X-Type", values: ["Swap"]} 
    ],
    recipients: [$address],
    after: $after
  ) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const PERMASWAP_SWAP_QUERY_WITH_CURSOR = `
query($address: String!, $after: String) {
  transactions(
    first: 10,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Transfer"]},
      { name: "X-Client", values: ["Roam"]},
      { name: "X-Type", values: ["Swap"]} 
    ],
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
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const PERMASWAP_ORDER_NOTICE_QUERY = `
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
      cursor
      node {
        id
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const SWAP_TRANSFER_QUERY = `
query($address: String!, $pushedFors: [String!]!) {
  transactions(
    first: 10,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Transfer"]},
      { name: "X-Client", values: ["Roam"]},
      { name: "X-Type", values: ["Swap"]},
      { name: "Pushed-For", values: $pushedFors },
    ],
    owners: [$address],
  ) {
    edges {
      node {
        id
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;

export const AOX_SWAP_QUERY = `
query($address: String!, $txIds: [ID!]!) {
  transactions(
    ids: $txIds,
    first: 10,
    tags: [
      {name: "Action", values: ["Transfer", "Burn"]},
      { name: "X-Client", values: ["Roam"]},
      { name: "X-Type", values: ["Swap"]},
    ],
    owners: [$address],
  ) {
    edges {
      node {
        id
        recipient
        owner { address }
        block { timestamp, height }
        tags { name, value }
      }
    }
  }
}`;
