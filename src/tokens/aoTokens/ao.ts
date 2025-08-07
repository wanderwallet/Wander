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
import { isNetworkError, NetworkError, BalanceFetchError } from "~utils/error/error.utils";
import activeAddress from "~api/modules/active_address";
import { findGateway } from "~gateways/wayfinder";
import BigNumber from "bignumber.js";
import type { Token } from "~tokens/token";
import { CACHE_API } from "~constants/api";
import Arweave from "arweave";
import { queryClient } from "~utils/tanstack";

let tokens: TokenInfo[] = null;

export let tokenInfoMap = new Map<string, TokenInfo | Token>();

export type AoInstance = ReturnType<typeof connect>;

export const AR_PROCESS_ID = "AR" as const;
export const WNDR_PROCESS_ID = "7GoQfmSOct_aUOWKM4xbKGg6DzAmOgdKwg8Kf-CbHm4" as const;
export const WAR_PROCESS_ID = "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10" as const;
export const WUSDC_PROCESS_ID = "7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ" as const;
export const PI_PROCESS_ID = "4hXj_E-5fAKmo4E8KjgQvuDJKAFk9P2grhycVmISDLs" as const;
export const EXP_PROCESS_ID = "aYrCboXVSl1AXL9gPFe3tfRxRf0ZmkOXH65mKT0HHZw" as const;
export const ARIO_PROCESS_ID = "qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE" as const;
export const USDA_PROCESS_ID = "FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8" as const;
export const AO_PROCESS_ID = "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc" as const;
export const AO_OLD_PROCESS_ID = "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w" as const;
export const PIXL_PROCESS_ID = "DM3FoZUq_yebASPhgd8pEIRIzDW6muXEhxz5-JwbZwo" as const;
export const TRUNK_PROCESS_ID = "wOrb8b_V8QixWyXZub48Ki5B6OIDyf_p1ngoonsaRpQ" as const;
export const AGENT_PROCESS_ID = "8rbAftv7RaPxFjFk5FGUVAVCSjGQB4JHDcb9P9wCVhQ" as const;
export const LQD_PROCESS_ID = "n2MhPK0O3yEvY2zW73sqcmWqDktJxAifJDrri4qireI" as const;
export const BOTG_PROCESS_ID = "Nx-_Ichdp-9uO_ZKg2DLWPiRlg-DWrSa2uGvINxOjaE" as const;
export const ACTION_PROCESS_ID = "OiNYKJ16jP7uj7z0DJO7JZr9ClfioGacpItXTn9fKn8" as const;
export const PL_PROCESS_ID = "Jc2bcfEbwHFQ-qY4jqm8L5hc-SggeVA1zlW6DOICWgo" as const;
export const SMONEY_PROCESS_ID = "K59Wi9uKXBQfTn3zw7L_t-lwHAoq3Fx-V9sCyOY3dFE" as const;
export const APUS_PROCESS_ID = "mqBYxpDsolZmJyBdTK8TJp_ftOuIUXVYcSQ8MYZdJg0" as const;
export const LOAD_PROCESS_ID = "gx_jKk-hy8-sB4Wv5WEuvTTVyIRWW3We7rRHthcohBQ" as const;

export const AO_PROCESS_BALANCE_MIRROR = "Pi-WmAQp2-mh-oWH9lWpz5EthlUDj_W0IusAv-RXhRk" as const;
export const AO_AUTHORITY_ID = "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY" as const;

export const VERIFIED_TOKENS = new Set<string>([
  AR_PROCESS_ID,
  WNDR_PROCESS_ID,
  WAR_PROCESS_ID,
  WUSDC_PROCESS_ID,
  PI_PROCESS_ID,
  EXP_PROCESS_ID,
  ARIO_PROCESS_ID,
  USDA_PROCESS_ID,
  AO_PROCESS_ID,
  PIXL_PROCESS_ID,
  TRUNK_PROCESS_ID,
  AGENT_PROCESS_ID,
  LQD_PROCESS_ID,
  BOTG_PROCESS_ID,
  ACTION_PROCESS_ID,
  PL_PROCESS_ID,
  SMONEY_PROCESS_ID,
  APUS_PROCESS_ID,
  LOAD_PROCESS_ID,
]);

export const AR_LOGO = "jZ2XPRj37W-QNb3BwWWIyEelv-7nQjBHg0g6WLX91IM";

export const AR_TOKEN_INFO: TokenInfo = {
  Name: "AR",
  Ticker: "AR",
  Denomination: 12,
  Logo: AR_LOGO,
  processId: AR_PROCESS_ID,
};

export const defaultTokens = [
  AR_TOKEN_INFO,
  {
    Name: "AO",
    Ticker: "AO",
    Denomination: 12,
    Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
    processId: AO_PROCESS_ID,
  },
  {
    Name: "Permaweb Index Token",
    Ticker: "PI",
    Denomination: 12,
    Logo: "zmQwyD6QiZge10OG2HasBqu27Zg0znGkdFRufOq6rv0",
    processId: PI_PROCESS_ID,
  },
  {
    Name: "Wander",
    Ticker: "WNDR",
    Denomination: 18,
    Logo: "xUO2tQglSYsW89aLYN8ErGivZqezoDaEn95JniaCBZk",
    processId: WNDR_PROCESS_ID,
  },
  {
    Name: "Astro USD",
    Ticker: "USDA",
    Denomination: 12,
    Logo: "seXozJrsP0OgI0gvAnr8zmfxiHHb5iSlI9wMI8SdamE",
    processId: USDA_PROCESS_ID,
  },
  {
    Name: "Wrapped AR",
    Ticker: "wAR",
    Denomination: 12,
    Logo: "L99jaxRKQKJt9CqoJtPaieGPEhJD3wNhR4iGqc8amXs",
    processId: WAR_PROCESS_ID,
  },
] as const satisfies TokenInfo[];

export const nonTransferableTokenIds: Array<string> = [EXP_PROCESS_ID, WNDR_PROCESS_ID];

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

const { dryrun: customDryrun } = connect({ CU_URL: "https://cu.ardrive.io" });

const getDryrunForProcess = (processId: string) => {
  return processId === ARIO_PROCESS_ID || processId === USDA_PROCESS_ID || processId === WNDR_PROCESS_ID
    ? { dryrunFn: customDryrun, isCustomDryrun: true }
    : { dryrunFn: dryrun, isCustomDryrun: false };
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

  const { dryrunFn, isCustomDryrun } = getDryrunForProcess(process);
  const tags = [{ name: "Action", value: "Balance" }];

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

export const createDataItemSigner =
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

    return transferID;
  } catch (err) {
    console.log("err", err);
    return undefined;
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
