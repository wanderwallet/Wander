import type { WalletInterface } from "~components/welcome/load/Migrate";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStorage } from "~utils/storage";
import { defaultGateway } from "~gateways/gateway";
import { ExtensionStorage } from "~utils/storage";
import { findGateway } from "~gateways/wayfinder";
import type { HardwareApi } from "./hardware";
import type { StoredWallet } from "~wallets";
import Arweave from "arweave";
import { isPasswordFresh } from "./auth";
import { useQuery } from "@tanstack/react-query";
import { getNameServiceProfiles } from "~lib/nameservice";

/**
 * Wallets with details hook
 */
export function useWalletsDetails(wallets: JWKInterface[]) {
  const [walletDetails, setWalletDetails] = useState<WalletInterface[]>([]);

  useEffect(() => {
    (async () => {
      const arweave = new Arweave(defaultGateway);
      const details: WalletInterface[] = [];

      // load wallet addresses
      for (const wallet of wallets) {
        const address = await arweave.wallets.getAddress(wallet);

        // skip already added wallets
        if (!!walletDetails.find((w) => w.address === address)) {
          continue;
        }

        details.push({ address });
      }

      // load ans labels
      try {
        const profiles = await getNameServiceProfiles(
          details.map((w) => w.address)
        );

        for (const wallet of details) {
          const profile = profiles.find((p) => p.address === wallet.address);

          if (!profile?.name) continue;
          wallet.label = profile.name;
        }
      } catch {}

      // set details
      setWalletDetails(details);
    })();
  }, [wallets]);

  return walletDetails;
}

/**
 * Active wallet data (unencrypted)
 */
export function useActiveWallet() {
  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  // active wallet
  const wallet = useMemo(
    () =>
      wallets?.find(({ address }) => address === activeAddress) || {
        address: activeAddress,
        nickname: "",
        type: "local"
      },
    [activeAddress, wallets]
  );

  return wallet;
}

/**
 * Type of the current wallet (local/hardware => what type of API for the hardware)
 */
export function useHardwareApi() {
  // current wallet
  const wallet = useActiveWallet();

  // hardware wallet type
  const hardwareApi = useMemo<HardwareApi | false>(
    () => (wallet?.type === "hardware" && wallet.api) || false,
    [wallet]
  );

  return hardwareApi;
}

/**
 * Active wallet balance
 */
export function useBalance() {
  // grab address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const fetchBalance = useCallback(async () => {
    if (!activeAddress) return "0";

    const gateway = await findGateway({ random: true });
    const arweave = new Arweave(gateway);

    // fetch balance
    const winstonBalance = await arweave.wallets.getBalance(activeAddress);
    if (isNaN(+winstonBalance)) {
      throw new Error("Invalid balance returned");
    }
    const arBalance = arweave.ar.winstonToAr(winstonBalance);
    return arBalance;
  }, [activeAddress]);

  return useQuery({
    queryKey: ["arBalance", activeAddress],
    queryFn: async () => {
      const balance = await fetchBalance();
      return balance || "0";
    },
    refetchInterval: 300_000,
    staleTime: 300_000,
    gcTime: 300_000,
    retry: 3,
    select: (data) => data || "0",
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    enabled: !!activeAddress
  });
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const handler = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    handler.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (handler.current) {
        clearTimeout(handler.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to determine if a password prompt should be shown to the user
 *
 * @description Returns true when the stored password has expired and user needs to re-enter it.
 *
 * @returns {boolean} True if password prompt should be shown, false otherwise
 */
export const useAskPassword = (): boolean => {
  const [askPassword, setAskPassword] = useState(false);

  useEffect(() => {
    isPasswordFresh().then((isFresh) => setAskPassword(!isFresh));
  }, []);

  return askPassword;
};
