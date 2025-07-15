const TRANSAK_SAVINGS_PROCESS_ID = "1kebeITRKxp9fQIj1Q9h7Ozo27GSv085TC94spI9-CY" as const;

export const TRANSAK_SAVINGS_QUERY = `
query ($wallet: String!) {
  transactions(
    first: 10,
    recipients: ["${TRANSAK_SAVINGS_PROCESS_ID}"],
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Add-Savings-Response"]},
      {name: "Wallet", values: [$wallet]}
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
