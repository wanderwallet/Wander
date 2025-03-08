import { useEffect, useState } from "react";
import { getTagValue, Id, Owner, type Message, type TokenInfo } from "./ao";
import { getAoTokens } from "~tokens";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { dryrun } from "@permaweb/aoconnect/browser";

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
          typeof data?.transferable === "boolean" ||
          typeof data?.Transferable === "boolean" ||
          Ticker === "ATOMIC"
            ? "collectible"
            : "asset";

        if (Ticker && Name) {
          return {
            processId: id,
            Ticker,
            Name,
            Denomination: Number(Denomination || 0),
            Logo,
            type
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
      type: Transferable || Ticker === "ATOMIC" ? "collectible" : "asset"
    };
  }

  throw new Error("Could not load token info.");
}

export async function getTokenInfo(id: string): Promise<TokenInfo> {
  // query ao
  const res = await dryrun({
    Id,
    Owner,
    process: id,
    tags: [{ name: "Action", value: "Info" }]
  });

  return getTokenInfoFromData(res, id);
}

export function useTokenIDs(): [string[], boolean] {
  // all token ids
  const [tokenIDs, setTokenIDs] = useState<string[]>([]);

  // loading
  const [loading, setLoading] = useState(true);

  const [aoTokens] = useStorage<any[]>({
    key: "ao_tokens",
    instance: ExtensionStorage
  });

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const aoTokens = await getAoTokens();
        const aoTokenIds = aoTokens.map((token) => token.processId);
        setTokenIDs(aoTokenIds);
      } catch {}

      setLoading(false);
    })();
  }, [aoTokens]);

  return [tokenIDs, loading];
}
