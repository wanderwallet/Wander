import type { JWKInterface } from "arweave/node/lib/wallet";
import { ExtensionStorage } from "~utils/storage";
import type { HardwareWallet } from "./hardware";
import browser from "webextension-polyfill";
import Arweave from "arweave/web/common";
import {
  decryptWallet,
  encryptWallet,
  freeDecryptedWallet
} from "./encryption";
import {
  checkPassword,
  getDecryptionKeyOrRequestUnlock,
  setDecryptionKey
} from "./auth";
import { ArweaveSigner } from "arbundles";
import {
  DEFAULT_MODULE_APP_DATA,
  ERR_MSG_NO_ACTIVE_WALLET,
  ERR_MSG_NO_WALLETS_ADDED
} from "~utils/auth/auth.constants";
import type { ModuleAppData } from "~api/background/background-modules";
import { isNotCancelError } from "~utils/assertions";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { resetStorage } from "~utils/storage.utils";

/**
 * Locally stored wallet
 *
 * KeyfileFormat - string(encrypted) / JWKInterface(decrypted)
 */
export interface LocalWallet<KeyfileFormat = string> {
  type: "local";
  nickname: string;
  address: string;
  keyfile: KeyfileFormat;
}

/**
 * KeyfileFormat - string(encrypted) / JWKInterface(decrypted)
 */
export type StoredWallet<KeyfileFormat = string> =
  | LocalWallet<KeyfileFormat>
  | HardwareWallet;

/**
 * Get wallets from storage
 *
 * @returns Wallets in storage
 */
export async function getWallets() {
  let wallets: StoredWallet[] = await ExtensionStorage.get("wallets");

  return wallets || [];
}

/**
 * Get the active address
 */
export async function getActiveAddress() {
  const activeAddress = await ExtensionStorage.get("active_address");

  return activeAddress;
}

/**
 * Get active wallet
 *
 * @returns Used wallet
 */
export async function getActiveWallet() {
  // fetch data from storage
  const wallets = await getWallets();
  const activeAddress = await getActiveAddress();

  return wallets.find((wallet) => wallet.address === activeAddress);
}

/**
 * Update active address
 *
 * @param address Updated active address
 */
export async function setActiveWallet(address?: string) {
  // verify address
  const wallets = await getWallets();

  // remove if the address is undefined
  if (!address) {
    return await ExtensionStorage.remove("active_address");
  }

  if (!wallets.find((wallet) => wallet.address === address)) {
    return;
  }

  // save new active address
  await ExtensionStorage.set("active_address", address);
}

export type DecryptedWallet = StoredWallet<JWKInterface>;

export async function openOrSelectWelcomePage(force = false) {
  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
    log(LOG_GROUP.AUTH, `PREVENTED openOrSelectWelcomePage(${force})`);

    return;
  }

  // ONLY BROWSER EXTENSION BELOW THIS LINE:

  log(LOG_GROUP.AUTH, `openOrSelectWelcomePage(${force})`);

  // Make sure we clear any stored value from previous installations before
  // opening the welcome page to onboard the user:
  // Skip reset for test environment
  const manifest = browser.runtime.getManifest();
  if (manifest["__TEST_MODE__"] !== true) {
    await resetStorage();
  }

  const url = browser.runtime.getURL("tabs/welcome.html");
  const welcomePageTabs = await browser.tabs.query({ url });
  const welcomePageTabID = welcomePageTabs[0]?.id;

  if (welcomePageTabID) {
    if (force) {
      // More aggressive version, just select the existing tab:
      browser.tabs.update(welcomePageTabID, { active: true });
    } else {
      // Less aggressive version, just highlight the existing tab but do not select it:
      browser.tabs.highlight({ tabs: welcomePageTabID });
    }
  } else {
    browser.tabs.create({ url });
  }
}

/**
 * Get the active wallet with decrypted JWK
 *
 * !!IMPORTANT!!
 *
 * When using this function, always make sure to remove the keyfile
 * from the memory, after it is no longer needed, using the
 * "freeDecryptedWallet(activekeyfile.keyfile)" function.
 *
 * @returns Active wallet with decrypted JWK
 */
export async function getActiveKeyfile(
  appData: ModuleAppData = DEFAULT_MODULE_APP_DATA
): Promise<DecryptedWallet> {
  try {
    const activeWallet = await getActiveWallet();

    if (!activeWallet) {
      throw new Error(ERR_MSG_NO_ACTIVE_WALLET);
    }

    // return if hardware wallet
    if (activeWallet.type === "hardware") {
      return activeWallet;
    }

    // Get the `decryptionKey` if Wander is already unlocked, or unlock Wander if needed. This means the auth popup
    // will be displayed, prompting the user to enter their password:
    const decryptionKey = await getDecryptionKeyOrRequestUnlock(appData);

    // decrypt keyfile
    const decryptedKeyfile = await decryptWallet(
      activeWallet.keyfile,
      decryptionKey
    );

    // construct decrypted wallet object
    const decryptedWallet: DecryptedWallet = {
      ...activeWallet,
      keyfile: decryptedKeyfile
    };

    return decryptedWallet;
  } catch (err) {
    isNotCancelError(err);

    // If we ended up here due to an error other than the user closing the auth modal, such as there are no wallets
    // added, open the welcome page:
    openOrSelectWelcomePage();

    throw new Error(ERR_MSG_NO_WALLETS_ADDED);
  }
}

/**
 * Get the wallet with decrypted JWK
 *
 * !!IMPORTANT!!
 *
 * When using this function, always make sure to remove the keyfile
 * from the memory, after it is no longer needed, using the
 * "freeDecryptedWallet(activekeyfile.keyfile)" function.
 *
 * @returns wallet with decrypted JWK
 */
export async function getKeyfile(address: string): Promise<DecryptedWallet> {
  // fetch data from storage
  const wallets = await getWallets();
  const wallet = wallets.find((wallet) => wallet.address === address);

  if (!wallet) {
    throw new Error(`Wallet ${address} not found`);
  }

  // return if hardware wallet
  if (wallet.type === "hardware") {
    return wallet;
  }

  // Get the `decryptionKey` if Wander is already unlocked, or unlock Wander if needed. This means the auth popup
  // will be displayed, prompting the user to enter their password:
  const decryptionKey = await getDecryptionKeyOrRequestUnlock(
    DEFAULT_MODULE_APP_DATA
  );

  // decrypt keyfile
  const decryptedKeyfile = await decryptWallet(wallet.keyfile, decryptionKey);

  // construct decrypted wallet object
  const decryptedWallet: DecryptedWallet = {
    ...wallet,
    keyfile: decryptedKeyfile
  };

  return decryptedWallet;
}

/**
 * Function to generate a unique nickname for a wallet.
 *
 * This function scans the existing wallets to find the next available
 * nickname in the format "Account X", where X is the smallest unused
 * positive integer.
 *
 * @param {WalletWithNickname[]} wallets - The array of existing wallets, each with a potential nickname.
 * @returns {string} The unique nickname for the new wallet.
 */
function generateUniqueNickname(wallets: WalletWithNickname[]): string {
  const existingNumbers = new Set<number>();

  // Populate the set with existing account numbers
  wallets.forEach((wallet) => {
    const match = wallet?.nickname?.match(/Account (\d+)/);
    if (match) {
      const accountNumber = parseInt(match[1], 10);
      // Add positive account numbers to the set
      if (accountNumber > 0) {
        existingNumbers.add(accountNumber);
      }
    }
  });

  // Find the next available number
  let number = 1;
  while (existingNumbers.has(number)) {
    number++;
  }

  return `Account ${number}`;
}

/**
 * Add a wallet for the user
 *
 * @param wallet Wallet JWK object
 * @param password Password to encrypt with
 */
export async function addWallet(
  wallet:
    | JWKInterface
    | WalletWithNickname
    | JWKInterface[]
    | WalletWithNickname[],
  password: string
) {
  // check password
  if (!(await checkPassword(password))) {
    throw new Error("Invalid password");
  }

  const arweave = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https"
  });

  const walletsToAdd = Array.isArray(wallet)
    ? wallet
    : // @ts-expect-error
      [wallet?.wallet ? wallet : { wallet }];

  // wallets
  const wallets = await getWallets();
  const freshInstall = wallets.length === 0;

  for (const item of walletsToAdd) {
    // @ts-expect-error
    const keyfile: JWKInterface = item.wallet || item;

    // prepare data for storing
    const address = await arweave.wallets.jwkToAddress(keyfile);
    const encrypted = await encryptWallet(keyfile, password);

    if (wallets.find((val) => val.address === address)) {
      continue;
    }

    // push wallet
    wallets.push({
      type: "local",
      // @ts-expect-error
      nickname: item.nickname || generateUniqueNickname(wallets),
      address,
      keyfile: encrypted
    });
  }

  // save data
  await ExtensionStorage.set("wallets", wallets);

  // set active address if this was the first wallet added
  if (freshInstall) {
    await ExtensionStorage.set("active_address", wallets[0].address);
  }
}

/**
 * updates password across all accounts for the user
 *
 * @param newPassword new password
 * @param prevPassword previous password to verify
 */
export async function updatePassword(
  newPassword: string,
  prevPassword: string
) {
  if (!(await checkPassword(prevPassword))) {
    throw new Error("Invalid password");
  }

  const wallets = await getWallets();

  for (const item of wallets) {
    if (item.type !== "local") {
      continue;
    }

    const decryptedKeyfile = await decryptWallet(item.keyfile, prevPassword);
    const encrypted = await encryptWallet(decryptedKeyfile, newPassword);
    freeDecryptedWallet(decryptedKeyfile);
    item.keyfile = encrypted;
  }

  // update state
  await setDecryptionKey(newPassword);
  await ExtensionStorage.set("wallets", wallets);
}

/**
 * Remove a wallet from the storage
 *
 * @param address Address of the wallet to remove
 */
export async function removeWallet(address: string) {
  // fetch wallets
  let wallets = await getWallets();

  // remove the wallet
  wallets = wallets.filter((wallet) => wallet.address !== address);

  // save updated wallets array
  await ExtensionStorage.set("wallets", wallets);

  // handle active address change
  const activeAddress = await getActiveAddress();

  if (activeAddress === address) {
    const newActiveAddress = wallets[0]?.address;

    await ExtensionStorage.set("active_address", newActiveAddress);
  }
}

/**
 * Read an Arweave wallet from a file
 *
 * @param file File to read from
 * @returns JWK key
 */
export const readWalletFromFile = (file: File) =>
  new Promise<JWKInterface>((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onerror = (e) => reject(e);
    reader.onabort = () => reject("Aborted reading");
    reader.onload = async (e) => {
      const res = e!.target!.result;

      if (!res || typeof res !== "string")
        return reject("Invalid result from reader");

      try {
        const jwk = JSON.parse(res);

        resolve(jwk);
      } catch (e) {
        reject(e.message || e);
      }
    };
  });

interface WalletWithNickname {
  wallet: JWKInterface;
  nickname?: string;
}

export interface WalletKeyLengths {
  actualLength: number;
  expectedLength: number;
  match: boolean;
}

export async function getWalletKeyLength(
  jwk: JWKInterface
): Promise<WalletKeyLengths> {
  const signer = new ArweaveSigner(jwk);
  const expectedLength = signer.ownerLength;
  const actualLength = signer.publicKey.byteLength;
  const match = actualLength === expectedLength;
  return { actualLength, expectedLength, match };
}
