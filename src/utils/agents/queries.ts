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
