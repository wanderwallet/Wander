import { useEffect, useState } from "react";
import { getAoTokens } from "~tokens";
import { PersistentStorage, useStorage } from "~utils/storage";

export function useTokenIDs(): [string[], boolean] {
  // all token ids
  const [tokenIDs, setTokenIDs] = useState<string[]>([]);

  // loading
  const [loading, setLoading] = useState(true);

  const [aoTokens] = useStorage<any[]>({
    key: "ao_tokens",
    instance: PersistentStorage
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
