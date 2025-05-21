import { connect, dryrun } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";
import { PersistentStorage } from "~utils/storage";
import { Quantity } from "ao-tokens";
import { ArweaveSigner, createData } from "@dha-team/arbundles";
import { getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import { AO_NATIVE_TOKEN, AO_NATIVE_TOKEN_BALANCE_MIRROR } from "~utils/ao_import";
import type { KeystoneSigner } from "~wallets/hardware/keystone";
import browser from "webextension-polyfill";
import type { DecodedTag } from "~api/modules/sign/tags";
import { isNetworkError, NetworkError, BalanceFetchError } from "~utils/error/error.utils";
import activeAddress from "~api/modules/active_address";
import { findGateway } from "~gateways/wayfinder";
import BigNumber from "bignumber.js";
import type { Token } from "~tokens/token";
import { CACHE_API } from "~constants/api";
import Arweave from "arweave";

let tokens: TokenInfo[] = null;
export let tokenInfoMap = new Map<string, TokenInfo | Token>();

export type AoInstance = ReturnType<typeof connect>;

export const AR_PROCESS_ID = "AR" as const;

export const defaultTokens = [
  {
    Name: "AR",
    Ticker: "AR",
    Denomination: 12,
    Logo: "jZ2XPRj37W-QNb3BwWWIyEelv-7nQjBHg0g6WLX91IM",
    processId: AR_PROCESS_ID,
  },
  {
    Name: "AO",
    Ticker: "AO",
    Denomination: 12,
    Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
    processId: AO_NATIVE_TOKEN,
  },
  {
    Name: "Permaweb Index Token",
    Ticker: "PI",
    Denomination: 12,
    Logo: "zmQwyD6QiZge10OG2HasBqu27Zg0znGkdFRufOq6rv0",
    processId: "4hXj_E-5fAKmo4E8KjgQvuDJKAFk9P2grhycVmISDLs",
  },
  {
    Name: "Q Arweave",
    Ticker: "qAR",
    Denomination: 12,
    Logo: "26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0",
    processId: "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8",
  },
  {
    Name: "Wrapped AR",
    Ticker: "wAR",
    Denomination: 12,
    Logo: "L99jaxRKQKJt9CqoJtPaieGPEhJD3wNhR4iGqc8amXs",
    processId: "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
  },
] as const satisfies TokenInfoWithProcessId[];

/**
 * Dummy ID
 */
export const Id = "0000000000000000000000000000000000000000001";

/**
 * Dummy owner
 */
export const Owner = "0000000000000000000000000000000000000000002";

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

type CreateDataItemSigner = (wallet: any) => (args: CreateDataItemArgs) => Promise<DataItemResult>;

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
            Denomination: Number(Denomination || 0),
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

    if (!Ticker && !Name) continue;

    return {
      processId: id,
      Name,
      Ticker,
      Denomination: Number(Denomination || 0),
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
        "Cache-Control": "public, max-age=300", // 5 minutes
      },
    });
    const data = await response.json();

    return { ...data.tokenInfo, processId: id };
  } catch {
    // query ao
    const res = await dryrun({
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

export const fetchTokenByProcessId = async (processId: string): Promise<TokenInfo | null> => {
  if (tokenInfoMap.has(processId)) {
    return tokenInfoMap.get(processId) as TokenInfo;
  }

  if (!tokens) {
    const [aoTokens, aoTokensCache] = await Promise.all([
      PersistentStorage.get<TokenInfo[]>("ao_tokens"),
      PersistentStorage.get<TokenInfo[]>("ao_tokens_cache"),
    ]);

    tokens = [...(aoTokens || []), ...(aoTokensCache || [])];
  }

  if (!processId) return null;

  const tokenInfo = tokens.find((token) => token.processId === processId);
  if (tokenInfo) {
    tokenInfoMap.set(processId, tokenInfo);
    return tokenInfo;
  }

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

  const res = await dryrun({
    Id,
    Owner: address,
    process,
    tags: [{ name: "Action", value: "Balance" }],
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

export async function getNativeTokenBalance(address: string): Promise<string> {
  const res = await dryrun({
    Id,
    Owner: address,
    process: AO_NATIVE_TOKEN_BALANCE_MIRROR,
    tags: [{ name: "Action", value: "Balance" }],
  });
  const balance = res.Messages[0].Data;
  return balance ? new Quantity(BigInt(balance), BigInt(12)).toString() : "0";
}

/**
 * Find the value for a tag name
 */
export const getTagValue = (tagName: string, tags: (Tag | DecodedTag)[]) => tags.find((t) => t.name === tagName)?.value;

export const sendAoTransfer = async (ao: AoInstance, process: string, recipient: string, amount: string) => {
  try {
    const decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const createDataItemSigner =
      (wallet: any) =>
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
        const signer = new ArweaveSigner(wallet);
        const dataItem = createData(data, signer, { tags, target, anchor });

        await dataItem.sign(signer);

        return {
          id: dataItem.id,
          raw: dataItem.getRaw(),
        };
      };
    const signer = createDataItemSigner(keyfile);
    const transferID = await ao.message({
      process,
      signer,
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
    freeDecryptedWallet(decryptedWallet.keyfile);
    return transferID;
  } catch (err) {
    console.log("err", err);
  }
};

export const sendAoTransferKeystone = async (
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string,
  keystoneSigner: KeystoneSigner,
) => {
  try {
    const dataItemSigner = async ({
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
      const dataItem = createData(data, signer, { tags, target, anchor });
      const serial = dataItem.getRaw();
      const signature = await signer.sign(serial);
      dataItem.setSignature(Buffer.from(signature));

      return {
        id: dataItem.id,
        raw: dataItem.getRaw(),
      };
    };
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
    return transferID;
  } catch (err) {
    console.log("err", err);
  }
};

export interface TokenInfo {
  Name?: string;
  Ticker?: string;
  Logo?: string;
  Denomination: number;
  processId?: string;
  lastUpdated?: string | null;
  type?: "asset" | "collectible";
  hidden?: boolean;
}

export type TokenInfoWithProcessId = TokenInfo & { processId: string };

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
