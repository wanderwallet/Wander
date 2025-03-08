import { useMemo } from "react";
import { defaultConfig } from "./config";
import { connect, dryrun } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { Quantity } from "ao-tokens";
import { Arweave, ArweaveSigner, createData } from "arbundles";
import { getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import {
  AO_NATIVE_TOKEN,
  AO_NATIVE_TOKEN_BALANCE_MIRROR,
  EXP_TOKEN
} from "~utils/ao_import";
import type { KeystoneSigner } from "~wallets/hardware/keystone";
import browser from "webextension-polyfill";
import { fetchTokenByProcessId } from "~lib/transactions";
import type { DecodedTag } from "~api/modules/sign/tags";
import {
  isNetworkError,
  NetworkError,
  BalanceFetchError
} from "~utils/error/error.utils";
import { getTokenInfo } from "./router";
import activeAddress from "~api/modules/active_address";
import { findGateway } from "~gateways/wayfinder";
import { defaultQueryCache, useTokenPrices } from "~tokens/hooks";
import { useQueries } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import type { Token } from "~tokens/token";

export type AoInstance = ReturnType<typeof connect>;

export const defaultTokens: TokenInfo[] = [
  {
    Name: "AR",
    Ticker: "AR",
    Denomination: 12,
    Logo: "jZ2XPRj37W-QNb3BwWWIyEelv-7nQjBHg0g6WLX91IM",
    processId: "AR"
  },
  {
    Name: "AO",
    Ticker: "AO",
    Denomination: 12,
    Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
    // processId: "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w"
    processId: "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc"
  },
  {
    Name: "Q Arweave",
    Ticker: "qAR",
    Denomination: 12,
    Logo: "26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0",
    processId: "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8"
  },
  {
    Name: "Wrapped AR",
    Ticker: "wAR",
    Denomination: 12,
    Logo: "L99jaxRKQKJt9CqoJtPaieGPEhJD3wNhR4iGqc8amXs",
    processId: "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10"
  }
];

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

type CreateDataItemSigner = (
  wallet: any
) => (args: CreateDataItemArgs) => Promise<DataItemResult>;

export function useAo() {
  // ao instance
  const ao = useMemo(() => connect(defaultConfig), []);

  return ao;
}

function moveTokenToTop(tokens: Token[], tokenId: string) {
  const tokenIndex = tokens.findIndex((t) => t.id === tokenId);
  if (tokenIndex !== -1) {
    const token = tokens.splice(tokenIndex, 1)[0];
    tokens.unshift(token);
  }
}

export function useAoTokens({
  type,
  hidden,
  sortFn
}: {
  type?: "asset" | "collectible";
  hidden?: boolean;
  sortFn?: (a: TokenInfo, b: TokenInfo) => number;
} = {}): {
  tokens: TokenInfoWithBalance[];
  loading: boolean;
  changeTokenVisibility: (tokenId: string, hidden: boolean) => void;
} {
  const [aoTokens, setAoTokens] = useStorage<TokenInfo[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const changeTokenVisibility = (tokenId: string, hidden: boolean) => {
    setAoTokens((tokens) =>
      tokens.map((t) => (t.processId === tokenId ? { ...t, hidden } : t))
    );
  };

  // fetch token infos
  const tokens = useMemo(() => {
    const filteredTokens = aoTokens
      .filter((t) => {
        const typeMatch =
          !type ||
          (type === "asset" && (t.type === "asset" || !t.type)) ||
          (type === "collectible" && t.type === "collectible");

        const hiddenMatch =
          hidden === undefined || (t.hidden ?? false) === hidden;

        return typeMatch && hiddenMatch;
      })
      .map((aoToken) => ({
        id: aoToken.processId,
        balance: "0",
        Ticker: aoToken.Ticker,
        Name: aoToken.Name,
        Denomination: Number(aoToken.Denomination || 0),
        Logo: aoToken?.Logo,
        type: aoToken.type || "asset",
        hidden: aoToken?.hidden ?? false
      }));

    moveTokenToTop(filteredTokens, AO_NATIVE_TOKEN);
    moveTokenToTop(filteredTokens, "AR");

    if (sortFn) {
      filteredTokens.sort(sortFn);
    }

    return filteredTokens;
  }, [aoTokens, type, hidden, sortFn]);

  return { tokens, loading: false, changeTokenVisibility };
}

export function useBalanceSortedTokens({
  type,
  hidden
}: {
  type?: "asset" | "collectible";
  hidden?: boolean;
} = {}): {
  tokens: TokenInfoWithBalance[];
  loading: boolean;
  prices: Record<string, number | null>;
} {
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [aoTokens] = useStorage<TokenInfo[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const tokensByHidden = useMemo(
    () =>
      aoTokens.filter((t) => {
        const typeMatch =
          !type ||
          (type === "asset" && (t.type === "asset" || !t.type)) ||
          (type === "collectible" && t.type === "collectible");

        const hiddenMatch =
          hidden === undefined || (t.hidden ?? false) === hidden;

        return typeMatch && hiddenMatch;
      }),
    [aoTokens, type, hidden]
  );

  const { prices } = useTokenPrices(
    tokensByHidden
      .map((t) => t.processId)
      .filter((id) => id !== "AR" && id !== EXP_TOKEN)
  );

  const tokenBalanceQueries = useQueries({
    queries: tokensByHidden.map((token) => ({
      queryKey: ["tokenBalance", token.processId, activeAddress],
      ...defaultQueryCache
    }))
  });

  // fetch token infos
  const tokens = useMemo(() => {
    const filteredTokens = tokensByHidden.map((aoToken, index) => ({
      id: aoToken.processId,
      balance: tokenBalanceQueries[index].data || "0",
      Ticker: aoToken.Ticker,
      Name: aoToken.Name,
      Denomination: Number(aoToken.Denomination || 0),
      Logo: aoToken?.Logo,
      type: aoToken.type || "asset",
      hidden: aoToken?.hidden ?? false,
      fiatBalance: BigNumber(tokenBalanceQueries[index].data || "0")
        .times(prices[aoToken.processId] || 0)
        .toString()
    }));

    const sortedTokens = filteredTokens.sort((a, b) => {
      // If both tokens have fiat balance, compare those
      if (+a.fiatBalance && +b.fiatBalance) {
        return +b.fiatBalance - +a.fiatBalance;
      }
      // If only one has fiat balance, prioritize it
      if (+a.fiatBalance) return -1;
      if (+b.fiatBalance) return 1;
      // If neither has fiat balance, compare token balances
      return +b.balance - +a.balance;
    });

    moveTokenToTop(sortedTokens, AO_NATIVE_TOKEN);
    moveTokenToTop(sortedTokens, "AR");

    return sortedTokens;
  }, [tokensByHidden, prices, tokenBalanceQueries]);

  return { tokens, loading: false, prices };
}

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

export async function getAoTokenBalance(
  address: string,
  process: string,
  aoToken?: TokenInfo
): Promise<Quantity> {
  if (!aoToken) {
    const aoTokens =
      (await ExtensionStorage.get<TokenInfo[]>("ao_tokens")) || [];

    aoToken = aoTokens.find((token) => token.processId === process);
  }

  const res = await dryrun({
    Id,
    Owner: address,
    process,
    tags: [{ name: "Action", value: "Balance" }]
  });

  const errorMessage = (res as any)?.error || res?.Error;

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  if (res.Messages.length === 0) {
    throw new Error(
      "Invalid token process: Balance action handler missing or unsupported."
    );
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
  address: string
): Promise<Quantity> {
  const res = await dryrun({
    Id,
    Owner: address,
    // @ts-ignore
    process: collectible.processId || collectible.id,
    tags: [{ name: "Action", value: "Balance" }],
    data: JSON.stringify({ Target: address })
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
    tags: [{ name: "Action", value: "Balance" }]
  });
  const balance = res.Messages[0].Data;
  return balance ? new Quantity(BigInt(balance), BigInt(12)).toString() : "0";
}

/**
 * Find the value for a tag name
 */
export const getTagValue = (tagName: string, tags: (Tag | DecodedTag)[]) =>
  tags.find((t) => t.name === tagName)?.value;

export const sendAoTransfer = async (
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string
) => {
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
        anchor
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
          raw: dataItem.getRaw()
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
          value: recipient
        },
        { name: "Quantity", value: amount },
        { name: "Client", value: "Wander" },
        { name: "Client-Version", value: browser.runtime.getManifest().version }
      ]
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
  keystoneSigner: KeystoneSigner
) => {
  try {
    const dataItemSigner = async ({
      data,
      tags = [],
      target,
      anchor
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
        raw: dataItem.getRaw()
      };
    };
    const transferID = await ao.message({
      process,
      signer: dataItemSigner,
      tags: [
        { name: "Action", value: "Transfer" },
        {
          name: "Recipient",
          value: recipient
        },
        { name: "Quantity", value: amount },
        { name: "Client", value: "Wander" },
        { name: "Client-Version", value: browser.runtime.getManifest().version }
      ]
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

export async function fetchTokenBalance(
  token: TokenInfo,
  address: string,
  refresh?: boolean
): Promise<string> {
  try {
    if (token.processId === "AR") {
      return await getArTokenBalance(address);
    } else {
      if (refresh) token = await getTokenInfo(token.processId);
      if (token.type === "collectible") {
        return (await getAoCollectibleBalance(token, address)).toString();
      } else {
        return (
          await getAoTokenBalance(address, token.processId, token)
        ).toString();
      }
    }
  } catch (error) {
    if (isNetworkError(error)) {
      throw new NetworkError(
        `Network error while fetching balance for ${token.processId}`
      );
    }
    throw new BalanceFetchError(
      `Failed to fetch balance for ${token.processId}`
    );
  }
}

export async function getBotegaPrice(tokenId: string): Promise<number | null> {
  try {
    const res = await dryrun({
      process: "Meb6GwY5I9QN77F0c5Ku2GpCFxtYyG1mfJus2GWYtII",
      data: "",
      tags: [
        {
          name: "Action",
          value: "Get-Price-For-Token"
        },
        {
          name: "Base-Token-Process",
          value: tokenId
        },
        {
          name: "Quote-Token-Process",
          value: "USD"
        }
      ]
    });

    const price = res.Messages[0].Tags.find(
      (tag: any) => tag.name === "Price"
    )?.value;

    return price ? Number(price) : null;
  } catch (error) {
    console.error("Error fetching Botega price:", error);
    return null;
  }
}

export async function getBotegaPrices(
  tokenIds: string[]
): Promise<Record<string, number | null>> {
  try {
    const res = await dryrun({
      process: "Meb6GwY5I9QN77F0c5Ku2GpCFxtYyG1mfJus2GWYtII",
      data: "",
      tags: [
        {
          name: "Action",
          value: "Get-Price-For-Tokens"
        },
        {
          name: "Tokens",
          value: JSON.stringify(tokenIds)
        }
      ]
    });

    const pricesTag = res.Messages[0].Tags.find((tag) => tag.name === "Prices");
    if (!pricesTag?.value)
      return Object.fromEntries(tokenIds.map((id) => [id, null]));

    const prices: Record<string, number | null> = {};
    Object.entries(pricesTag.value).forEach(
      ([tokenId, data]: [string, any]) => {
        prices[tokenId] = data.price || null;
      }
    );

    return prices;
  } catch (error) {
    console.error("Error fetching Botega prices:", error);
    return Object.fromEntries(tokenIds.map((id) => [id, null]));
  }
}
