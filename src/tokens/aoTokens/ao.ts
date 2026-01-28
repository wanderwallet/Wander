import { connect, dryrun } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";
import { PersistentStorage } from "~utils/storage";
import { Quantity } from "ao-tokens";
import { ArweaveSigner, createData } from "@dha-team/arbundles";
import { getActiveKeyfile, getKeyfile, type DecryptedWallet } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import { generateAnchor, type KeystoneSigner } from "~wallets/hardware/keystone";
import browser from "webextension-polyfill";
import type { DecodedTag } from "~api/modules/sign/tags";
import { isNetworkError, NetworkError, BalanceFetchError, TransferError } from "~utils/error/error.utils";
import activeAddress from "~api/modules/active_address";
import { findGateway } from "~gateways/wayfinder";
import BigNumber from "bignumber.js";
import { CACHE_API } from "~constants/api";
import Arweave from "arweave";
import { queryClient } from "~utils/tanstack";
import { Id, Owner, AR_PROCESS_ID, AO_PROCESS_ID, UTD_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import type { Token } from "~tokens/token";
import type { FlpTokenInfo } from "~utils/fair_launch/fair_launch.types";
import { ARIO_MAINNET_PROCESS_ID, ARIO_TESTNET_PROCESS_ID } from "@ar.io/sdk/web";
import { defaultConfig } from "./config";
import { gql } from "~gateways/api";
import { TRANSFER_RESULT_QUERY } from "~notifications/utils";
import { retryWithDelay } from "~utils/promises/retry";
import { validateGqlResponse } from "~routes/popup/swap/utils/swap.utils";

export let tokens: TokenInfo[] = null;
export let flpTokens: FlpTokenInfo[] = null;
export let tokenInfoMap = new Map<string, TokenInfo | Token>();

export type AoInstance = ReturnType<typeof connect>;

export interface Message {
  Anchor: string;
  Tags: Tag[];
  Target: string;
  Data: string;
}

type CreateDataItemArgs = {
  data: any;
  tags?: Tag[];
  target?: string;
  anchor?: string;
};

type DataItemResult = {
  id: string;
  raw: ArrayBuffer;
};

const ao = connect(defaultConfig);

export const ARDRIVE_CU_URL = "https://cu.ardrive.io";
export const DEFAULT_CU_URL = "https://cu.ao-testnet.xyz";

const { dryrun: arDriveDryrun } = connect({ CU_URL: ARDRIVE_CU_URL });

const ARDRIVE_PROCESSES = [ARIO_MAINNET_PROCESS_ID, ARIO_TESTNET_PROCESS_ID];

export const getDryrunForProcess = (processId: string) => {
  if (ARDRIVE_PROCESSES.includes(processId)) return { dryrunFn: arDriveDryrun, isCustomDryrun: true };

  return { dryrunFn: dryrun, isCustomDryrun: false };
};

export const getCuUrlForProcess = (processId: string) => {
  if (ARDRIVE_PROCESSES.includes(processId)) return ARDRIVE_CU_URL;
  return DEFAULT_CU_URL;
};

export function getTokenInfoFromData(res: any, id: string): TokenInfo {
  // find message with token info
  for (const msg of res.Messages as Message[]) {
    if (msg?.Data) {
      try {
        const data = JSON.parse(msg.Data);
        const Ticker = data.Ticker || data.ticker;
        const Name = data.Name || data.name;
        const Denomination = data.Denomination || data.denomination;
        const Logo = data.Logo || data.logo || id;
        const type =
          typeof data?.transferable === "boolean" || typeof data?.Transferable === "boolean" || Ticker === "ATOMIC"
            ? "collectible"
            : "asset";

        if (Ticker && Name) {
          return {
            processId: id,
            Ticker,
            Name,
            Denomination: Number(Denomination) || 0,
            Logo,
            type,
          } as TokenInfo;
        }
      } catch {}
    }
    const Ticker = getTagValue("Ticker", msg.Tags);
    const Name = getTagValue("Name", msg.Tags);
    const Denomination = getTagValue("Denomination", msg.Tags);
    const Logo = getTagValue("Logo", msg.Tags);
    const Transferable = getTagValue("Transferable", msg.Tags);

    if (!Ticker || !Name) continue;

    return {
      processId: id,
      Name,
      Ticker,
      Denomination: Number(Denomination) || 0,
      Logo,
      type: Transferable || Ticker === "ATOMIC" ? "collectible" : "asset",
    };
  }

  throw new Error("Could not load token info.");
}

export async function getTokenInfo(id: string): Promise<TokenInfo> {
  try {
    const response = await fetch(`${CACHE_API}/api/token-info?tokenId=${id}`, {
      cache: "force-cache",
      headers: {
        "Cache-Control": "public, max-age=3600", // 1 hour
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch token info");
    }

    const data = await response.json();

    return { ...data.tokenInfo, processId: id };
  } catch {
    // query ao
    const { dryrunFn } = getDryrunForProcess(id);
    const res = await dryrunFn({
      Id,
      Owner,
      process: id,
      tags: [{ name: "Action", value: "Info" }],
    });

    return getTokenInfoFromData(res, id);
  }
}

async function fetchTokenInfo(processId: string) {
  try {
    if (tokenInfoMap.has(processId)) {
      return tokenInfoMap.get(processId) as TokenInfo;
    }

    const tokenInfo = await getTokenInfo(processId);
    tokenInfoMap.set(processId, tokenInfo);
    return tokenInfo;
  } catch {
    return null;
  }
}

export const fetchTokenByProcessId = async (processId: string, onlyCache = false): Promise<TokenInfo | null> => {
  if (!processId) return null;

  const cached = tokenInfoMap.get(processId);
  if (cached) return cached as TokenInfo;

  if (!tokens) {
    const [aoTokens, aoTokensCache] = await Promise.all([
      PersistentStorage.get<TokenInfo[]>("ao_tokens"),
      PersistentStorage.get<TokenInfo[]>("ao_tokens_cache"),
    ]);

    tokens = [...(aoTokens || []), ...(aoTokensCache || [])];
  }

  const tokenInfo = tokens.find((token) => token.processId === processId);
  if (tokenInfo) {
    tokenInfoMap.set(processId, tokenInfo);
    return tokenInfo;
  }

  try {
    if (!flpTokens?.length) {
      const queryState = queryClient.getQueryState<FlpTokenInfo[]>(["fair-launch-tokens"]);
      flpTokens = queryState?.data || [];
    }

    const flpToken = flpTokens.find((token) => token.processId === processId);
    if (flpToken) {
      const { autoClaim, flpId, ...tokenInfo } = flpToken;
      tokenInfoMap.set(processId, tokenInfo);
      return tokenInfo;
    }
  } catch {}

  if (onlyCache) return null;

  return fetchTokenInfo(processId);
};

export async function getArTokenBalance(address: string) {
  if (!activeAddress) return "0";

  const gateway = await findGateway({});
  const arweave = new Arweave(gateway);

  const winstonBalance = await arweave.wallets.getBalance(address);
  if (isNaN(+winstonBalance)) {
    throw new Error("Invalid balance returned");
  }
  const arBalance = BigNumber(winstonBalance).shiftedBy(-12).toFixed();
  return arBalance;
}

export async function getAoTokenBalance(address: string, process: string, aoToken?: TokenInfo): Promise<Quantity> {
  if (!aoToken) {
    const aoTokens = (await PersistentStorage.get<TokenInfo[]>("ao_tokens")) || [];

    aoToken = aoTokens.find((token) => token.processId === process);
  }

  const { dryrunFn, isCustomDryrun } = getDryrunForProcess(process);
  const tags = [
    { name: "Action", value: "Balance" },
    { name: "Recipient", value: address },
    { name: "Target", value: address },
  ];

  if (isCustomDryrun) {
    tags.push({ name: "Referer", value: "Wander" });
  }

  const res = await dryrunFn({
    Id,
    Owner: address,
    process,
    tags,
  });

  const errorMessage = (res as any)?.error || res?.Error;

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  if (res.Messages.length === 0) {
    throw new Error("Invalid token process: Balance action handler missing or unsupported.");
  }

  for (const msg of res.Messages as Message[]) {
    const balance = getTagValue("Balance", msg.Tags);

    if (balance && +balance) {
      if (!aoToken) {
        aoToken = await fetchTokenByProcessId(process);
        if (!aoToken) {
          throw new Error("Could not load token info.");
        }
      }

      return new Quantity(BigInt(balance), BigInt(aoToken.Denomination));
    }
  }

  // default return
  return new Quantity(0n, 12n);
}

export async function getAoCollectibleBalance(
  collectible: TokenInfoWithBalance | TokenInfo,
  address: string,
): Promise<Quantity> {
  const res = await dryrun({
    Id,
    Owner: address,
    // @ts-ignore
    process: collectible.processId || collectible.id,
    tags: [{ name: "Action", value: "Balance" }],
    data: JSON.stringify({ Target: address }),
  });

  const balance = res.Messages[0].Data;
  return balance
    ? new Quantity(BigInt(balance), BigInt(collectible.Denomination))
    : new Quantity(0, BigInt(collectible.Denomination));
}

/**
 * Find the value for a tag name
 */
export const getTagValue = (tagName: string, tags: (Tag | DecodedTag)[]) => tags.find((t) => t.name === tagName)?.value;

export const getTagValues = (tagNames: string[], tags: (Tag | DecodedTag)[]): (string | undefined)[] => {
  const tagMap = new Map(tags.map((tag) => [tag.name, tag.value]));
  return tagNames.map((name) => tagMap.get(name));
};

export const getTagValueMap = (tags: (Tag | DecodedTag)[]): Map<string, string> => {
  return new Map(tags.map((tag) => [tag.name, tag.value]));
};

/**
 * Flatten tags to a key value object
 */
export const flattenTags = (tags: Tag[]) =>
  tags.reduce(
    (acc, tag) => {
      acc[tag.name] = tag.value;
      return acc;
    },
    {} as Record<string, string>,
  );

export const createDataItemSigner =
  (jwkOrSigner: any) =>
  async ({
    data,
    tags = [],
    target,
    anchor,
  }: {
    data: any;
    tags?: { name: string; value: string }[];
    target?: string;
    anchor?: string;
  }): Promise<{ id: string; raw: ArrayBuffer }> => {
    const signer = jwkOrSigner instanceof ArweaveSigner ? jwkOrSigner : new ArweaveSigner(jwkOrSigner);
    const dataItem = createData(data, signer, { tags, target, anchor });

    await dataItem.sign(signer);

    return {
      id: dataItem.id,
      // @ts-ignore
      raw: dataItem.getRaw(),
    };
  };

export const createDataItemKeystoneSigner =
  (keystoneSigner: KeystoneSigner) =>
  async ({
    data,
    tags = [],
    target,
    anchor,
  }: {
    data: any;
    tags?: { name: string; value: string }[];
    target?: string;
    anchor?: string;
  }): Promise<{ id: string; raw: ArrayBuffer }> => {
    const signer = keystoneSigner;
    if (!anchor) {
      // @ts-ignore - anchor can be uint8array or string
      anchor = generateAnchor();
    }
    const dataItem = createData(data, signer, { tags, target, anchor });
    const serial = dataItem.getRaw();
    const signature = await signer.sign(serial);
    dataItem.setSignature(Buffer.from(signature));

    return {
      id: dataItem.id,
      // @ts-ignore
      raw: dataItem.getRaw(),
    };
  };

export const sendAoTransfer = async (
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string,
  tags: (Tag | DecodedTag)[] = [],
) => {
  return sendAoTransferForWallet(ao, process, recipient, amount, tags);
};

/**
 * Sends AO transfer for a specific wallet address
 * @param ao - AO instance
 * @param process - Process ID
 * @param recipient - Recipient address
 * @param amount - Amount to transfer
 * @param walletAddress - Specific wallet address to use for signing
 * @param tags - Additional tags
 * @returns Message ID
 */
export async function sendAoTransferForWallet(
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string,
  tags: (Tag | DecodedTag)[] = [],
  walletAddress?: string,
): Promise<string | undefined> {
  let decryptedWallet: DecryptedWallet;
  try {
    decryptedWallet = walletAddress ? await getKeyfile(walletAddress) : await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const signer = createDataItemSigner(keyfile);
    const transferID = await ao.message({
      process,
      signer,
      tags: [
        { name: "Action", value: "Transfer" },
        { name: "Recipient", value: recipient },
        { name: "Quantity", value: amount },
        { name: "Client", value: "Wander" },
        { name: "Client-Version", value: browser.runtime.getManifest().version },
        ...tags,
      ],
    });

    const errorMessage = await checkTransferError(process, transferID);
    if (errorMessage) throw new TransferError(errorMessage);

    return transferID;
  } catch (err) {
    console.log("err", err);
    throw err;
  } finally {
    // Clean up keyfile from memory
    if (decryptedWallet && decryptedWallet.type !== "hardware") {
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}

export const sendAoTransferKeystone = async (
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string,
  keystoneSigner: KeystoneSigner,
) => {
  try {
    const dataItemSigner = createDataItemKeystoneSigner(keystoneSigner);
    const transferID = await ao.message({
      process,
      signer: dataItemSigner,
      tags: [
        { name: "Action", value: "Transfer" },
        {
          name: "Recipient",
          value: recipient,
        },
        { name: "Quantity", value: amount },
        { name: "Client", value: "Wander" },
        { name: "Client-Version", value: browser.runtime.getManifest().version },
      ],
    });

    const errorMessage = await checkTransferError(process, transferID);
    if (errorMessage) throw new TransferError(errorMessage);

    return transferID;
  } catch (err) {
    console.log("err", err);
    throw err;
  }
};

export interface TokenInfo {
  Name?: string;
  Ticker?: string;
  Logo?: string;
  Denomination: number;
  processId: string;
  lastUpdated?: string | null;
  type?: "asset" | "collectible";
  hidden?: boolean;
}

export interface TokenInfoWithBalance extends TokenInfo {
  id?: string;
  balance: string;
}

export async function fetchTokenBalance(token: TokenInfo, address: string, refresh?: boolean): Promise<string> {
  try {
    if (token.processId === AR_PROCESS_ID) {
      return await getArTokenBalance(address);
    } else {
      if (refresh) token = await fetchTokenByProcessId(token.processId);
      if (token.type === "collectible") {
        return (await getAoCollectibleBalance(token, address)).toString();
      } else {
        return (await getAoTokenBalance(address, token.processId, token)).toString();
      }
    }
  } catch (error) {
    if (isNetworkError(error)) {
      throw new NetworkError(`Network error while fetching balance for ${token.processId}`);
    }
    throw new BalanceFetchError(`Failed to fetch balance for ${token.processId}`);
  }
}

export async function getBotegaPrice(tokenId: string): Promise<number | null> {
  try {
    const response = await fetch(`${CACHE_API}/api/botega/prices?tokenIds=${tokenId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch price");
    }

    const data = await response.json();
    return data.prices?.[tokenId] ?? null;
  } catch (error) {
    console.error("Error fetching Botega price:", error);
    return null;
  }
}

export async function getBotegaPrices(tokenIds: string[]): Promise<Record<string, number | null>> {
  try {
    const queryString = tokenIds.join(",");
    const response = await fetch(`${CACHE_API}/api/botega/prices?tokenIds=${queryString}`);
    if (!response.ok) {
      throw new Error("Failed to fetch prices");
    }

    const data = await response.json();
    return data.prices || Object.fromEntries(tokenIds.map((id) => [id, null]));
  } catch (error) {
    console.error("Error fetching Botega prices:", error);
    return Object.fromEntries(tokenIds.map((id) => [id, null]));
  }
}

export async function getAOTokenPrice() {
  let price = 0;

  try {
    const queryKey = ["tokenPrice", AO_PROCESS_ID];
    const existingPrice = queryClient.getQueryState(queryKey);
    if (!existingPrice?.data) {
      price = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => getBotegaPrice(AO_PROCESS_ID),
        staleTime: 0,
        retry: 3,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      });
    } else {
      price = Number(existingPrice.data);
    }
  } catch {}

  return price;
}

async function checkMessageResultForError(process: string, transferId: string): Promise<string | null> {
  let errorMessage = null;
  try {
    const { Messages, Output, Error: error } = await ao.result({ process, message: transferId });

    if (Output?.data?.output) {
      errorMessage = Output.data.output;
    } else if (error) {
      if (typeof error === "object" && Object.keys(error).length > 0) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
    }
    if (!errorMessage) {
      (Messages || []).forEach((msg) => {
        const tags = msg.Tags || [];
        const transferErrorTag = tags.find((t: any) => t.name === "Action" && t.value === "Transfer-Error");
        if (transferErrorTag) {
          errorMessage = getTagValue("Error", tags) || browser.i18n.getMessage("transfer_error");
        }
      });
    }
  } catch {}

  return errorMessage;
}

async function checkMessageGraphqlResultForError(transferId: string): Promise<string | null> {
  const result = await retryWithDelay(
    async () => {
      const data = await gql(TRANSFER_RESULT_QUERY, { messageId: transferId });
      validateGqlResponse(data);
      if (data?.data?.transactions?.edges?.length === 0) {
        throw new Error("No transactions found");
      }
      return data;
    },
    5,
    1000,
  );
  if (result?.data?.transactions?.edges?.length > 0) {
    const edges = result?.data?.transactions?.edges || [];
    for (const edge of edges) {
      const tags = edge.node.tags || [];
      const transferErrorTag = tags.find((t: any) => t.name === "Action" && t.value === "Transfer-Error");
      if (transferErrorTag) {
        return getTagValue("Error", tags) || browser.i18n.getMessage("transfer_error");
      }
    }
  }
  return null;
}

export async function checkTransferError(process: string, transferId: string): Promise<string | null> {
  let timeoutId: NodeJS.Timeout;

  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), 10000);
  });

  try {
    return await Promise.race([
      checkMessageResultForError(process, transferId).catch(() => null),
      checkMessageGraphqlResultForError(transferId).catch(() => null),
      timeout,
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
