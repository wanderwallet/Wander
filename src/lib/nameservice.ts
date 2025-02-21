import { useEffect, useState } from "react";
import type { NameServiceProfile } from "./types";
import { getAnsNameServiceProfile } from "./ans";
import { getArNSProfile } from "./arns";
import { ExtensionStorage } from "~utils/storage";
import { getWallets } from "~wallets";

let IN_MEM_CACHE: Record<string, NameServiceProfile | "none"> = {};

/**
 * Refreshes memory and storage caches with latest from name services.
 */
async function updateCache() {
  // use wallets from storage to clear out any stale cache
  const wallets = await getWallets();
  const walletAddresses = wallets.map((w) => w.address);

  const newMemCache = {};

  for (let walletAddress of walletAddresses) {
    const profile =
      (await getArNSProfile(walletAddress)) ||
      (await getAnsNameServiceProfile(walletAddress));

    newMemCache[walletAddress] = profile || "none";
  }

  IN_MEM_CACHE = newMemCache;
  ExtensionStorage.set("name_service_cache", newMemCache);
}

// load cache from storage and then do background update
ExtensionStorage.get<Record<string, NameServiceProfile>>("name_service_cache")
  .then((cache) => {
    if (cache) {
      IN_MEM_CACHE = cache;
    }
    updateCache();
  })
  .catch((e) => {
    console.error(e);
  });

/**
 * Return a NameServiceProfile for a query
 *
 * @param walletAddress Address
 *
 * @returns NameServiceProfile | undefined
 */
export async function getNameServiceProfile(
  walletAddress: string
): Promise<NameServiceProfile | undefined> {
  const cached = IN_MEM_CACHE[walletAddress];
  if (cached) {
    return cached === "none" ? undefined : cached;
  }

  const profile =
    (await getArNSProfile(walletAddress)) ||
    (await getAnsNameServiceProfile(walletAddress));

  IN_MEM_CACHE[walletAddress] = profile || "none";
  ExtensionStorage.set("name_service_cache", IN_MEM_CACHE);

  return profile;
}

/**
 * Return NameServiceProfile[] for a wallet addresses
 *
 * @param walletAddress Address[]
 *
 * @returns NameServiceProfile[] | undefined
 */
export async function getNameServiceProfiles(
  walletAddress: string[]
): Promise<Array<NameServiceProfile>> {
  const profiles = [];
  for (let wallet of walletAddress) {
    const profile = await getNameServiceProfile(wallet);
    if (profile) {
      profiles.push(profile);
    }
  }
  return profiles;
}

/**
 * React hook for Nameservice (ArNS, ANS) profile
 *
 * @param walletAddress Address
 *
 * @returns NameServiceProfile | undefined
 */
export function useNameServiceProfile(walletAddress: string) {
  const [profile, setProfile] = useState<NameServiceProfile>();

  useEffect(() => {
    (async () => {
      if (!walletAddress) {
        return setProfile(undefined);
      }

      const profile = await getNameServiceProfile(walletAddress);

      setProfile(profile);
    })();
  }, [walletAddress]);

  return profile;
}
