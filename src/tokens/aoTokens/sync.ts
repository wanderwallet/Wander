import Arweave from "arweave";
import browser from "webextension-polyfill";
import { getAoTokensCache } from "~tokens";
import type { GQLTransactionsResultInterface } from "ar-gql/dist/faces";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import { getTokenInfoFromData } from "./router";
import { type TokenInfo, Id, Owner } from "./ao";
import { withRetry } from "~utils/promises/retry";
import { timeoutPromise } from "~utils/promises/timeout";

/** Tokens storage name */
export const AO_TOKENS = "ao_tokens";
export const AO_TOKENS_CACHE = "ao_tokens_cache";
export const AO_TOKENS_IDS = "ao_tokens_ids";
export const AO_TOKENS_IMPORT_TIMESTAMP = "ao_tokens_import_timestamp";
export const AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS =
  "ao_tokens_auto_import_restricted_ids";

/** Variables for sync */
let isSyncInProgress = false;
let lastHasNextPage = true;

export const gateway = {
  host: "arweave-search.goldsky.com",
  port: 443,
  protocol: "https"
};

async function getTokenInfo(id: string): Promise<TokenInfo> {
  const body = {
    Id,
    Target: id,
    Owner,
    Anchor: "0",
    Data: "1234",
    Tags: [
      { name: "Action", value: "Info" },
      { name: "Data-Protocol", value: "ao" },
      { name: "Type", value: "Message" },
      { name: "Variant", value: "ao.TN.1" }
    ]
  };
  const res = await (
    await fetch(`https://cu.ao-testnet.xyz/dry-run?process-id=${id}`, {
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body),
      method: "POST"
    })
  ).json();

  return getTokenInfoFromData(res, id);
}

function getNoticeTransactionsQuery(
  address: string,
  filterProcesses: string[]
) {
  return `query {
    transactions(
      recipients: ["${address}"]
      first: 100
      tags: [
        { name: "Data-Protocol", values: ["ao"] },
        ${
          filterProcesses.length > 0
            ? `{ name: "From-Process", values: [${filterProcesses.map(
                (process) => `"${process}"`
              )}], op: NEQ }`
            : ""
        },
        { name: "Action", values: ["Credit-Notice", "Debit-Notice"] }
      ]
      sort: HEIGHT_ASC
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          tags {
            name,
            value
          }
        }
      }
    }
  }`;
}

function getCollectiblesQuery() {
  return `query ($ids: [ID!]!) {
    transactions(
      ids: $ids
      tags: [
        { name: "Data-Protocol", values: ["ao"] },
        { name: "Type", values: ["Process"] },
        { name: "Implements", values: ["ANS-110"] },
        { name: "Content-Type" }
      ]
      first: 100
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          tags {
            name,
            value
          }
        }
      }
    }
  }`;
}

export async function verifyCollectiblesType(
  tokens: TokenInfo[],
  arweave: Arweave
) {
  const batchSize = 100;

  // Get IDs of tokens that are already marked as collectibles
  const idsToCheck = tokens
    .filter((token) => token.type === "collectible")
    .map((token) => token.processId);

  const collectibleIds = new Set<string>();
  const verifiedIds = new Set<string>();

  if (idsToCheck.length === 0) return tokens;

  const totalBatches = Math.ceil(idsToCheck.length / batchSize);

  // Process IDs in batches
  for (let batch = 0; batch < totalBatches; batch++) {
    try {
      const startIndex = batch * batchSize;
      const currentBatch = idsToCheck.slice(startIndex, startIndex + batchSize);

      const query = getCollectiblesQuery();
      const transactions = await withRetry(async () => {
        const response = await arweave.api.post("/graphql", {
          query,
          variables: { ids: currentBatch }
        });

        return response.data.data
          .transactions as GQLTransactionsResultInterface;
      }, 2);

      // Mark all IDs in this batch as verified
      currentBatch.forEach((id) => verifiedIds.add(id));

      if (transactions.edges.length > 0) {
        const processIds = transactions.edges.map((edge) => edge.node.id);
        processIds.forEach((processId) => collectibleIds.add(processId));
      }
    } catch (error) {
      console.error(
        `Failed to get transactions for batch ${batch}, error:`,
        error
      );
      continue;
    }
  }

  tokens = tokens.map((token) => {
    // Only modify tokens we've successfully verified
    if (token.type === "collectible" && verifiedIds.has(token.processId)) {
      if (collectibleIds.has(token.processId)) {
        return { ...token, type: "collectible" };
      }
      return { ...token, type: "asset" };
    }
    return token;
  });

  return tokens;
}

export async function getNoticeTransactions(
  arweave: Arweave,
  address: string,
  filterProcesses: string[] = [],
  fetchCountLimit = 5
) {
  let fetchCount = 0;
  let hasNextPage = true;
  let ids = new Set<string>();

  // Fetch atmost 500 transactions
  while (hasNextPage && fetchCount <= fetchCountLimit) {
    try {
      const query = getNoticeTransactionsQuery(address, filterProcesses);
      const transactions = await withRetry(async () => {
        const response = await arweave.api.post("/graphql", { query });
        return response.data.data
          .transactions as GQLTransactionsResultInterface;
      }, 2);
      hasNextPage = transactions.pageInfo.hasNextPage;

      if (transactions.edges.length === 0) break;

      const processIds = transactions.edges
        .map(
          (edge) =>
            edge.node.tags.find((tag) => tag.name === "From-Process")?.value
        )
        .filter(Boolean);
      processIds.forEach((processId) => ids.add(processId));
      filterProcesses = Array.from(
        new Set([...filterProcesses, ...Array.from(ids)])
      );
    } catch (error) {
      console.error(`Failed to get transactions, error:`, error);
      break;
    } finally {
      fetchCount += 1;
    }
  }
  return { processIds: Array.from(ids) as string[], hasNextPage };
}

/**
 *  Sync AO Tokens
 */
export async function syncAoTokens() {
  if (isSyncInProgress) {
    console.log("Already syncing AO tokens, please wait...");
    await new Promise((resolve) => {
      const checkState = setInterval(() => {
        if (!isSyncInProgress) {
          clearInterval(checkState);
          resolve(null);
        }
      }, 100);
    });
    return { hasNextPage: lastHasNextPage, syncCount: 0 };
  }

  isSyncInProgress = true;

  try {
    const activeAddress = await getActiveAddress();

    if (!activeAddress) {
      lastHasNextPage = false;
      return { hasNextPage: false, syncCount: 0 };
    }

    console.log("Synchronizing AO tokens...");

    const [aoTokensCache, aoTokensIds = {}] = await Promise.all([
      getAoTokensCache(),
      ExtensionStorage.get<Record<string, string[]>>(AO_TOKENS_IDS)
    ]);
    const walletTokenIds = aoTokensIds[activeAddress] || [];

    const arweave = new Arweave(gateway);
    const { processIds, hasNextPage } = await getNoticeTransactions(
      arweave,
      activeAddress,
      walletTokenIds
    );

    const newProcessIds = Array.from(new Set(processIds)).filter(
      (processId) => !walletTokenIds.includes(processId)
    );

    if (newProcessIds.length === 0) {
      console.log("No new ao tokens found!");
      lastHasNextPage = hasNextPage;
      return { hasNextPage, syncCount: 0 };
    }

    const promises = newProcessIds
      .filter(
        (processId) =>
          !aoTokensCache.some((token) => token.processId === processId)
      )
      .map((processId) =>
        withRetry(async () => {
          const token = await timeoutPromise(getTokenInfo(processId), 3000);
          return { ...token, processId };
        }, 2)
      );
    const results = await Promise.allSettled(promises);

    let tokens = [];
    const tokensWithoutTicker = [];
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const token = result.value;
        if (token.Ticker) {
          tokens.push(token);
        } else if (!walletTokenIds.includes(token.processId)) {
          tokensWithoutTicker.push(token);
        }
      }
    });

    // Verify collectibles type
    tokens = await verifyCollectiblesType(tokens, arweave);

    const updatedTokens = [...aoTokensCache, ...tokens];
    const updatedProcessIds = newProcessIds.filter((processId) =>
      updatedTokens.some((token) => token.processId === processId)
    );

    if (tokensWithoutTicker.length > 0) {
      updatedProcessIds.push(
        ...tokensWithoutTicker.map(({ processId }) => processId)
      );
    }

    walletTokenIds.push(...updatedProcessIds);
    aoTokensIds[activeAddress] = walletTokenIds;

    // Set all the tokens storage
    await Promise.all([
      ExtensionStorage.set(AO_TOKENS_CACHE, updatedTokens),
      ExtensionStorage.set(AO_TOKENS_IDS, aoTokensIds)
    ]);

    console.log("Synchronized ao tokens!");
    lastHasNextPage = hasNextPage;
    return { hasNextPage, syncCount: tokens.length };
  } catch (error: any) {
    console.log("Error syncing tokens: ", error?.message);
    lastHasNextPage = false;
    return { hasNextPage: false, syncCount: 0 };
  } finally {
    isSyncInProgress = false;
  }
}

export async function scheduleImportAoTokens() {
  const timestamp = await ExtensionStorage.get<number>(
    AO_TOKENS_IMPORT_TIMESTAMP
  );
  if (timestamp && Date.now() - timestamp < 5 * 60 * 1000) {
    console.log("Importing ao tokens is already running. Skipping...");
    return;
  }

  const activeAddress = await getActiveAddress();
  if (!activeAddress) return;

  await ExtensionStorage.set(AO_TOKENS_IMPORT_TIMESTAMP, Date.now());

  browser.alarms.create("import_ao_tokens", { when: Date.now() + 2000 });
}
