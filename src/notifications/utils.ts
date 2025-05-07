// JUST AR TRANSFER NOTIFICATIONS

export const AR_RECEIVER_QUERY = `
query ($address: String!) {
  transactions(first: 10, recipients: [$address], bundledIn: null) {
    edges {
      cursor
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name, 
          value
        }
      }
    }
  }
}
`;

export const AR_SENT_QUERY = `query ($address: String!) {
  transactions(first: 10, owners: [$address], bundledIn: null) {
    edges {
      cursor
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}`;

// JUST AR AND AO TRANSFER NOTIFSA

export const AO_RECEIVER_QUERY = `
query($address: String!) {
  transactions(
    first: 10, 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
      {name: "Action", values: ["Transfer"]},
      {name: "Recipient", values: [$address]}
    ]
  ) {
    edges {
      cursor
      node {
        recipient
        id
        owner { address }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}
`;

export const AF_ERROR_QUERY = `
query($messageId: String!) {
  transactions(
    first: 10,
    tags: [
      {name: "Data-Protocol", values: ["ao"]},
      {name: "Action", values: ["Transfer-Error"]},
      {name: "Message-Id", values: [$messageId]},
    ]
  ) {
    edges {
      cursor
      node {
        recipient
        id
        owner {
          address
        }
        block {
          timestamp
          height
        }
        tags {
          name
          value
        }
      }
    }
  }
}
`;

export const AO_SENT_QUERY = `
query($address: String!) {
  transactions(
    first: 10, 
    owners: [$address], 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
      {name: "Action", values: ["Transfer"]}
    ]
  ) {
    edges {
      cursor
      node {
        id
        recipient
        owner { address }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}`;

export const ALL_AR_RECEIVER_QUERY = `
query ($address: String!) {
  transactions(first: 20, recipients: [$address]) {
    edges {
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name, 
          value
        }
      }
    }
  }
}
`;

export const ALL_AR_SENT_QUERY = `query ($address: String!) {
  transactions(first: 20, owners: [$address]) {
    edges {
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}`;

export const AR_RECEIVER_QUERY_WITH_CURSOR = `
query ($address: String!, $after: String) {
  transactions(first: 10, recipients: [$address], bundledIn: null, after: $after) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}
`;

export const AR_SENT_QUERY_WITH_CURSOR = `
query ($address: String!, $after: String) {
  transactions(first: 10, owners: [$address], bundledIn: null, after: $after) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}
`;

export const AO_RECEIVER_QUERY_WITH_CURSOR = `
query($address: String!, $after: String) {
  transactions(
    first: 10, 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
      {name: "Action", values: ["Transfer"]},
      {name: "Recipient", values: [$address]}
    ],
    after: $after
  ) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        recipient
        id
        owner { address }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}
`;

export const AO_SENT_QUERY_WITH_CURSOR = `
query($address: String!, $after: String) {
  transactions(
    first: 10, 
    owners: [$address], 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
      {name: "Action", values: ["Transfer"]}
    ],
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
        tags {
          name
          value
        }
      }
    }
  }
}
`;

// PRINT ARWEAVE TRANSACTIONS
export const PRINT_ARWEAVE_QUERY = `
query ($address: String!) {
  transactions(
    first: 10,
    owners: [$address],
    tags: [{name: "Type", values: ["Print-Archive"]}]
  ) {
    edges {
      cursor
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        fee { ar }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}`;

export const PRINT_ARWEAVE_QUERY_WITH_CURSOR = `
query ($address: String!, $after: String) {
  transactions(
    first: 10,
    owners: [$address],
    tags: [{name: "Type", values: ["Print-Archive"]}],
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
        quantity { ar }
        fee { ar }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}`;

export const combineAndSortTransactions = (responses: any[]) => {
  const combinedTransactions = responses.reduce((acc, response) => {
    const transactions = response.data.transactions.edges;
    return acc.concat(transactions);
  }, []);

  combinedTransactions.sort((a, b) => {
    // If either transaction lacks a block, treat it as the most recent
    if (!a.node.block || !b.node.block) {
      // If both lack a block, maintain their order
      if (!a.node.block && !b.node.block) {
        return 0;
      }
      return a.node.block ? 1 : -1;
    }
    // For transactions with blocks, sort by timestamp in descending order (newer timestamps first)
    return b.node.block.timestamp - a.node.block.timestamp;
  });

  return combinedTransactions;
};

export const processTransactions = (combinedTransactions: any[], address: string) => {
  return combinedTransactions.map((transaction) => {
    let quantity = "0";
    let tokenId = "";
    let transactionType = "Transaction";
    let warpContract = false;
    let isAo = false;

    if (transaction.node.quantity && transaction.node.quantity.ar > 0) {
      tokenId = "AR";
      quantity = transaction.node.quantity.ar;
      transactionType = transaction.node.owner.address === address ? "Sent" : "Received";
    } else {
      // Check for Ao protocol transactions
      const dataProtocolTag = transaction.node.tags.find((tag) => tag.name === "Data-Protocol" && tag.value === "ao");
      const aoMessageTag = transaction.node.tags.find((tag) => tag.name === "Type" && tag.value === "Message");
      if (dataProtocolTag) {
        isAo = true;
        const typeTag = transaction.node.tags.find((tag) => tag.name === "Action");
        if (typeTag) {
          if (typeTag.value === "Transfer") {
            transactionType = transaction.node.owner.address === address ? "Sent" : "Received";
            const recipientTag = transaction.node.tags.find((tag) => tag.name === "Recipient");
            const quantityTag = transaction.node.tags.find((tag) => tag.name === "Quantity");
            if (recipientTag && transaction.node.recipient) tokenId = transaction.node.recipient;
            if (quantityTag) quantity = quantityTag.value;
          } else {
            transactionType = "Message";
          }
        }
        if (transactionType === "Transaction" && aoMessageTag.value === "Message") {
          transactionType = "Message";
        }
      } else {
        // Process non-Ao transactions or Warp contracts
        const contractTag = transaction.node.tags.find((tag) => tag.name === "Contract");
        if (contractTag) {
          tokenId = contractTag.value;
          warpContract = true;
          transactionType = transaction.node.owner.address === address ? "Sent" : "Received";
        } else {
          const printArchiveTag = transaction.node.tags.find(
            (tag) => tag.name === "Type" && tag.value === "Print-Archive",
          );
          if (printArchiveTag) {
            transactionType = "PrintArchive";
          }
        }
      }
    }
    const modifiedTransaction = {
      ...transaction,
      transactionType,
      quantity,
      ...(isAo && { isAo }),
      ...(tokenId && { tokenId }),
    };

    if (warpContract) {
      modifiedTransaction["warpContract"] = warpContract;
    }
    return modifiedTransaction;
  });
};
