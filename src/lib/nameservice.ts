import { useState } from "react";
import type { NameServiceProfile } from "./types";
import { getAnsNameServiceProfile } from "./ans";
import { getArNSProfile } from "./arns";
import { ExtensionStorage } from "~utils/storage";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";

let IN_MEM_CACHE: Record<string, NameServiceProfile | null> = {};
let isCacheInitialized = false;

async function initializeNameServiceCache() {
  if (isCacheInitialized) return IN_MEM_CACHE;

  try {
    const cache = await ExtensionStorage.get<Record<string, NameServiceProfile | null>>("name_service_cache");
    IN_MEM_CACHE = cache || {};
  } catch (e) {
    console.error("Failed to initialize name service cache:", e);
  }

  isCacheInitialized = true;
  return IN_MEM_CACHE;
}

async function getProfileFromCache(walletAddress: string): Promise<NameServiceProfile | null> {
  const cache = await initializeNameServiceCache();
  const cachedProfile = cache[walletAddress];
  return cachedProfile;
}

async function setProfileInCache(walletAddress: string, profile: NameServiceProfile | undefined) {
  const cache = await initializeNameServiceCache();
  cache[walletAddress] = profile || null;

  await ExtensionStorage.set("name_service_cache", cache).catch((e) => {
    console.error("Failed to save name service profile to cache:", e);
  });
}

/**
 * Return a NameServiceProfile for a query
 *
 * @param walletAddress Address
 *
 * @returns NameServiceProfile | undefined
 */
export async function getNameServiceProfile(
  walletAddress: string,
  refresh = false,
): Promise<NameServiceProfile | undefined> {
  try {
    if (!walletAddress) return undefined;

    if (!refresh) {
      const cachedProfile = await getProfileFromCache(walletAddress);
      if (cachedProfile !== undefined) {
        return cachedProfile === null ? undefined : cachedProfile;
      }
    }

    const profile = (await getArNSProfile(walletAddress)) || (await getAnsNameServiceProfile(walletAddress));
    await setProfileInCache(walletAddress, profile);
    return profile;
  } catch (e) {
    console.error("Failed to fetch name service profile:", e);
    return undefined;
  }
}

/**
 * Return NameServiceProfile[] for a wallet addresses
 *
 * @param walletAddress Address[]
 *
 * @returns NameServiceProfile[] | undefined
 */
export async function getNameServiceProfiles(
  walletAddresses: string[],
  refresh = false,
): Promise<Array<NameServiceProfile>> {
  if (!walletAddresses || walletAddresses.length === 0) return [];

  const profiles = [];
  for (let wallet of walletAddresses) {
    const profile = await getNameServiceProfile(wallet, refresh);
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

  useAsyncEffect(async () => {
    if (!walletAddress) {
      setProfile(undefined);
      return;
    }

    const profile = await getNameServiceProfile(walletAddress);

    setProfile(profile);
  }, [walletAddress]);

  return profile;
}

initializeNameServiceCache();
