import * as bip39 from "bip39-web-crypto";
import { addWallet, getWalletKeyLength, type WalletKeyLengths } from "~wallets";
import {
  checkPasswordValid,
  isValidMnemonic,
  jwkFromMnemonic,
  pkcs8ToJwk
} from "~wallets/generator";
import * as SSS from "shamir-secret-sharing";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import { setDecryptionKey } from "~wallets/auth";
import { INVALID_DEVICE_SHARES_INFO_ERR_MSG } from "~utils/wallets/wallets.constants";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type NodeForge from "node-forge";
import type { RecoveryJSON, Wallet } from "~utils/embedded/embedded.types";
import { EMBEDDED_FEATURE_FLAGS } from "~utils/embedded/embedded.constants";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";
import { random, pki, util } from "node-forge";

// Node forge worker script location
const workerScript = `/assets/forge/prime.worker.min.js`;

// Convert BigInt values to hex strings and encode to Base64
function bigintToBase64Url(bigint: NodeForge.jsbn.BigInteger): string {
  let hex = bigint.toString(16);
  if (hex.length % 2 !== 0) {
    // Ensure even length hex
    hex = "0" + hex;
  }

  // Convert hex to bytes
  const bytes = util.hexToBytes(hex);

  // Encode bytes to Base64
  let base64 = util.encode64(bytes);

  // Convert Base64 to Base64 URL encoding
  // Replace '+' with '-', '/' with '_', and remove '=' padding
  base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return base64;
}

async function generateSeedPhrase() {
  log(LOG_GROUP.WALLET_GENERATION, "generateSeedPhrase()");

  return bip39.generateMnemonic();
}

async function generateWalletJWK(seedPhrase: string): Promise<JWKInterface> {
  if (!seedPhrase) throw new Error("Missing `seedPhrase`");

  log(LOG_GROUP.WALLET_GENERATION, "generateWalletJWK()");

  let generatedKeyfile: JWKInterface | null = null;
  let walletKeyLength: WalletKeyLengths | null = null;

  let attempts = 0;

  // This do-while is used to just to make sure the key has the right length, as we had some reports
  // in the past of people having RSA-2048. In any case, this should never run more than once.
  do {
    ++attempts;

    generatedKeyfile = await jwkFromMnemonic(seedPhrase);

    walletKeyLength = await getWalletKeyLength(generatedKeyfile);
  } while (!generatedKeyfile || !walletKeyLength.match);

  if (attempts > 1) {
    // TODO: Send this to Sentry or whatever...
    console.warn(
      "Took multiple attempts to generate a wallet with the right length!"
    );
  }

  return generatedKeyfile;
}

export interface WorkShares {
  authShare: string;
  deviceShare: string;
}

async function generateWalletWorkShares(
  jwk: JWKInterface
): Promise<WorkShares> {
  log(LOG_GROUP.WALLET_GENERATION, "generateWalletWorkShares()");

  const privateKeyJWK = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-PSS", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const privateKeyPKCS8 = await window.crypto.subtle.exportKey(
    "pkcs8",
    privateKeyJWK
  );

  // Wanna know why these are called "shares" and not shards?
  // See https://discuss.hashicorp.com/t/is-it-shards-or-shares-in-shamir-secret-sharing/38978/3

  const [authShareBuffer, deviceShareBuffer] = await SSS.split(
    new Uint8Array(privateKeyPKCS8),
    2,
    2
  );

  return {
    authShare: Buffer.from(authShareBuffer).toString("base64"),
    deviceShare: Buffer.from(deviceShareBuffer).toString("base64")
  };
}

export interface RecoverShares {
  recoveryAuthShare: string;
  recoveryBackupShare: string;
}

async function generateWalletRecoveryShares(
  jwk: JWKInterface
): Promise<RecoverShares> {
  log(LOG_GROUP.WALLET_GENERATION, "generateWalletRecoveryShares()");

  const privateKeyJWK = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-PSS", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const privateKeyPKCS8 = await window.crypto.subtle.exportKey(
    "pkcs8",
    privateKeyJWK
  );

  // Wanna know why these are called "shares" and not shards?
  // See https://discuss.hashicorp.com/t/is-it-shards-or-shares-in-shamir-secret-sharing/38978/3

  const [recoveryAuthShareBuffer, recoveryBackupShareBuffer] = await SSS.split(
    new Uint8Array(privateKeyPKCS8),
    2,
    2
  );

  return {
    recoveryAuthShare: Buffer.from(recoveryAuthShareBuffer).toString("base64"),
    recoveryBackupShare: Buffer.from(recoveryBackupShareBuffer).toString(
      "base64"
    )
  };
}

function generateRandomPassword(): string {
  log(LOG_GROUP.WALLET_GENERATION, "generateRandomPassword()");

  return Buffer.from(crypto.getRandomValues(new Uint8Array(512))).toString(
    "base64"
  );
}

async function generateWalletJWKFromShares(
  walletAddress: string,
  shares: string[]
): Promise<JWKInterface> {
  log(LOG_GROUP.WALLET_GENERATION, "generateWalletJWKFromShares()");

  const privateKeyPKCS8 = await SSS.combine(
    shares.map((share) => new Uint8Array(Buffer.from(share, "base64")))
  );

  // This functions throws a DataError if integrity fails:
  const privateKeyJWK = await pkcs8ToJwk(privateKeyPKCS8);

  const arweave = new Arweave(defaultGateway);

  // Most likely nothing below this line will run anyway:
  const addressCandidate = await arweave.wallets
    .jwkToAddress(privateKeyJWK)
    .catch(() => null);

  // From SSS' docs:
  // > Thus, it is the responsibility of users of this library to verify the integrity of the reconstructed secret.

  if (addressCandidate !== walletAddress) {
    throw new Error(`Unexpected generated address`);
  }

  return privateKeyJWK;
}

async function generateShareHash(share: string): Promise<string> {
  log(LOG_GROUP.WALLET_GENERATION, "generateShareHash()");

  const hashBuffer = await crypto.subtle.digest("SHA-256", Buffer.from(share));

  return Buffer.from(new Uint8Array(hashBuffer)).toString("base64");
}

export interface GenerateShareHashAndPublicKeyReturn {
  shareHash: string;
  sharePublicKey: string;
}

/**
 * See:
 * - https://github.com/framp/zero-knowledge-node/blob/master/keypair-auth/crypto-utils.js
 * - https://www.youtube.com/watch?v=cMoD0wIxIpQ
 */
async function generateShareHashAndPublicKey(
  share: string
): Promise<GenerateShareHashAndPublicKeyReturn> {
  log(LOG_GROUP.WALLET_GENERATION, "generateShareHashAndPublicKey()");

  if (!share) {
    throw new Error(
      "Share is missing — unable to generate share hash and public key."
    );
  }

  const sharePrng = random.createInstance();

  sharePrng.seedFileSync = (needed) => {
    let r = "",
      i = 0,
      j = 0;

    while (i++ < needed) {
      r += share[j++];
      if (j === share.length) j = 0;
    }

    return r;
  };

  return new Promise((resolve, reject) => {
    pki.rsa.generateKeyPair(
      {
        bits: 4096,
        prng: sharePrng,
        workerScript
      },
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          const shareHash = await generateShareHash(share);
          const publicKey = result.publicKey;
          const sharePublicKey = bigintToBase64Url(publicKey.n);

          resolve({
            shareHash,
            sharePublicKey
          });
        }
      }
    );
  });
}

export interface GenerateShareHashAndPrivateKeyReturn {
  shareHash: string;
  sharePrivateKeyJWK: JWKInterface;
}

/**
 * See:
 * - https://github.com/framp/zero-knowledge-node/blob/master/keypair-auth/crypto-utils.js
 * - https://www.youtube.com/watch?v=cMoD0wIxIpQ
 */
async function generateShareHashAndPrivateKey(
  share: string
): Promise<GenerateShareHashAndPrivateKeyReturn> {
  log(LOG_GROUP.WALLET_GENERATION, "generateShareHashAndPrivateKey()");

  if (!share) {
    throw new Error(
      "Share is missing — unable to generate share hash and private key."
    );
  }

  const sharePrng = random.createInstance();

  sharePrng.seedFileSync = (needed) => {
    let r = "",
      i = 0,
      j = 0;

    while (i++ < needed) {
      r += share[j++];
      if (j === share.length) j = 0;
    }

    return r;
  };

  return new Promise((resolve, reject) => {
    pki.rsa.generateKeyPair(
      {
        bits: 4096,
        prng: sharePrng,
        workerScript
      },
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          const shareHash = await generateShareHash(share);
          const privateKey = result.privateKey;

          // Extract and encode the RSA parameters into JWK format
          const sharePrivateKeyJWK = {
            kty: "RSA",
            n: bigintToBase64Url(privateKey.n),
            e: bigintToBase64Url(privateKey.e),
            d: bigintToBase64Url(privateKey.d),
            p: bigintToBase64Url(privateKey.p),
            q: bigintToBase64Url(privateKey.q),
            dp: bigintToBase64Url(privateKey.dP),
            dq: bigintToBase64Url(privateKey.dQ),
            qi: bigintToBase64Url(privateKey.qInv)
          };

          resolve({
            shareHash,
            sharePrivateKeyJWK
          });
        }
      }
    );
  });
}

// Data (localStorage):

const DEVICE_SHARES_INFO_KEY = "DEVICE_SHARES_INFO";

// walletId - deviceShare
export type DeviceShares = Record<string, string>;

// userId - DeviceShares
export type DeviceSharesByUser = Record<string, DeviceShares>;

let _deviceSharesByUser: DeviceSharesByUser | null = null;

async function loadDeviceSharesByUser(): Promise<DeviceSharesByUser> {
  try {
    const storage = await LocalStorage.getInstance();
    let deviceSharesInfo = storage.getItem<DeviceSharesByUser>(
      DEVICE_SHARES_INFO_KEY
    );

    // TODO: Add additional validation...

    if (typeof deviceSharesInfo !== "object" || !deviceSharesInfo) {
      deviceSharesInfo = {};
    }

    return deviceSharesInfo as DeviceSharesByUser;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(`${INVALID_DEVICE_SHARES_INFO_ERR_MSG}: ${err?.message}`);
    } else {
      console.warn(`${INVALID_DEVICE_SHARES_INFO_ERR_MSG}: ${err?.message}`);
    }
  }
}

export async function initializeDeviceShares() {
  _deviceSharesByUser = await loadDeviceSharesByUser();
  return _deviceSharesByUser;
}

// Getters:

async function getDeviceSharesForUser(userId: string): Promise<DeviceShares> {
  if (!_deviceSharesByUser) {
    await initializeDeviceShares();
  }

  return _deviceSharesByUser[userId] || {};
}

// Storage:

const ENCRYPTED_SEED_PHRASE_KEY = "ENCRYPTED_SEED_PHRASE";
const ENCRYPTED_RECOVERY_SHARE_KEY = "ENCRYPTED_RECOVERY_SHARE";

async function storeEncryptedSeedPhrase(
  walletId: string,
  seedPhrase: string,
  jwk: JWKInterface
) {
  log(LOG_GROUP.WALLET_GENERATION, "storeEncryptedSeedPhrase()");

  if (!jwk) {
    throw new Error("Do not store unencrypted seed phrases!");
  }

  const publicKey = {
    kty: "RSA",
    e: "AQAB",
    n: jwk.n,
    alg: "RSA-OAEP-256",
    ext: true
  };

  const importedKey = await crypto.subtle.importKey(
    "jwk",
    publicKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["encrypt"]
  );

  // Make sure the seedPhrase is shorter than the maximum data we can safely
  // encrypt with RSA-OAEM without using hybrid encryption:
  // See https://crypto.stackexchange.com/questions/42097/what-is-the-maximum-size-of-the-plaintext-message-for-rsa-oaep
  const maxLength = 4096 / 8 - (2 * 256) / 8 - 2;

  if (seedPhrase.length > maxLength) {
    throw new Error(`Seedphrase is too long to be encrypted with RSA-OAEP`);
  }

  const encryptedSeedPhraseBuffer = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    importedKey,
    Buffer.from(seedPhrase)
  );

  const encryptedSeedPhrase = Buffer.from(encryptedSeedPhraseBuffer).toString(
    "base64"
  );

  const storage = await LocalStorage.getInstance();
  storage.setItem(
    `${ENCRYPTED_SEED_PHRASE_KEY}-${walletId}`,
    encryptedSeedPhrase
  );
}

async function hasEncryptedSeedPhrase(walletId: string) {
  const storage = await LocalStorage.getInstance();
  return !!storage.getItem(`${ENCRYPTED_SEED_PHRASE_KEY}-${walletId}`);
}

async function getDecryptedSeedPhrase(walletId: string, jwk: JWKInterface) {
  log(LOG_GROUP.WALLET_GENERATION, "getDecryptedSeedPhrase()");

  if (!jwk) {
    throw new Error("Do not store unencrypted seed phrases!");
  }

  const privateKey = {
    ...jwk,
    alg: "RSA-OAEP-256",
    ext: true
  };

  const importedKey = await crypto.subtle.importKey(
    "jwk",
    privateKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["decrypt"]
  );

  const storage = await LocalStorage.getInstance();
  const encryptedSeedPhrase = storage.getItem(
    `${ENCRYPTED_SEED_PHRASE_KEY}-${walletId}`
  );

  const decryptedSeedPhraseBuffer = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    importedKey,
    Buffer.from(encryptedSeedPhrase, "base64")
  );

  const decryptedSeedPhrase = Buffer.from(decryptedSeedPhraseBuffer).toString();

  return decryptedSeedPhrase;
}

/**
 * Store an encrypted recovery share in local storage
 * @param walletId - Wallet ID
 * @param recoveryData - Recovery share data to encrypt
 * @param jwk - JWK to use for encryption
 */
async function storeEncryptedRecoveryShare(
  walletId: string,
  recoveryData: RecoveryJSON,
  jwk: JWKInterface
) {
  log(LOG_GROUP.WALLET_GENERATION, "storeEncryptedRecoveryShare()");

  if (!jwk) {
    throw new Error("Do not store unencrypted recovery shares!");
  }

  // Generate random AES key
  const aesKey = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt recovery data with AES
  const recoveryDataString = JSON.stringify(recoveryData);
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    aesKey,
    new TextEncoder().encode(recoveryDataString)
  );

  // Export AES key
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  // Encrypt AES key with RSA
  const publicKey = {
    kty: "RSA",
    e: "AQAB",
    n: jwk.n,
    alg: "RSA-OAEP-256",
    ext: true
  };

  const importedRsaKey = await crypto.subtle.importKey(
    "jwk",
    publicKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["encrypt"]
  );

  const encryptedAesKey = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    importedRsaKey,
    rawAesKey
  );

  // Combine everything into a single object
  const finalData = {
    iv: Buffer.from(iv).toString("base64"),
    encryptedKey: Buffer.from(encryptedAesKey).toString("base64"),
    encryptedData: Buffer.from(encryptedData).toString("base64")
  };

  const storage = await LocalStorage.getInstance();
  storage.setItem(`${ENCRYPTED_RECOVERY_SHARE_KEY}-${walletId}`, finalData);

  return true;
}

/**
 * Check if a wallet has an encrypted recovery share
 * @param walletId - Wallet ID
 */
async function hasEncryptedRecoveryShare(walletId: string) {
  const storage = await LocalStorage.getInstance();
  return !!storage.getItem(`${ENCRYPTED_RECOVERY_SHARE_KEY}-${walletId}`);
}

/**
 * Get and decrypt a wallet recovery share
 * @param walletId - Wallet ID
 * @param jwk - JWK for decryption
 */
async function getDecryptedRecoveryShare(
  walletId: string,
  jwk: JWKInterface
): Promise<RecoveryJSON> {
  log(LOG_GROUP.WALLET_GENERATION, "getDecryptedRecoveryShare()");

  if (!jwk) {
    throw new Error("Cannot decrypt recovery share without JWK!");
  }

  // Import RSA private key
  const privateKey = {
    ...jwk,
    alg: "RSA-OAEP-256",
    ext: true
  };

  const importedRsaKey = await crypto.subtle.importKey(
    "jwk",
    privateKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["decrypt"]
  );

  // Get encrypted data from storage
  const storage = await LocalStorage.getInstance();
  const encryptedData = storage.getItem<{
    iv: string;
    encryptedKey: string;
    encryptedData: string;
  }>(`${ENCRYPTED_RECOVERY_SHARE_KEY}-${walletId}`);

  if (!encryptedData) {
    throw new Error(`No recovery share found for wallet ${walletId}`);
  }

  // Parse the stored data
  const {
    iv,
    encryptedKey,
    encryptedData: encryptedRecoveryData
  } = encryptedData;

  // Decrypt the AES key
  const decryptedAesKeyBuffer = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    importedRsaKey,
    Buffer.from(encryptedKey, "base64")
  );

  // Import the decrypted AES key
  const aesKey = await crypto.subtle.importKey(
    "raw",
    decryptedAesKeyBuffer,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["decrypt"]
  );

  // Decrypt the actual data
  const decryptedDataBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Buffer.from(iv, "base64")
    },
    aesKey,
    Buffer.from(encryptedRecoveryData, "base64")
  );

  // Parse the decrypted data
  const decryptedDataString = new TextDecoder().decode(decryptedDataBuffer);
  const recoveryShare = JSON.parse(decryptedDataString) as RecoveryJSON;

  return recoveryShare;
}

async function storeDeviceShare(wallet: Wallet, userId: string) {
  log(LOG_GROUP.WALLET_GENERATION, "storeDeviceShare()");

  if (!_deviceSharesByUser) {
    await initializeDeviceShares();
  }

  if (!_deviceSharesByUser[userId]) _deviceSharesByUser[userId] = {};

  _deviceSharesByUser[userId][wallet.id] = wallet.deviceShare;

  const storage = await LocalStorage.getInstance();
  storage.setItem(DEVICE_SHARES_INFO_KEY, _deviceSharesByUser);
}

async function removeDeviceShare(walletId: string, userId: string) {
  log(LOG_GROUP.WALLET_GENERATION, "storeDeviceShare()");

  if (!_deviceSharesByUser) {
    await initializeDeviceShares();
  }

  if (!_deviceSharesByUser[userId]) _deviceSharesByUser[userId] = {};

  delete _deviceSharesByUser[userId][walletId];

  const storage = await LocalStorage.getInstance();
  storage.setItem(DEVICE_SHARES_INFO_KEY, _deviceSharesByUser);
}

async function storeEncryptedWalletJWK(jwk: JWKInterface): Promise<void> {
  log(LOG_GROUP.WALLET_GENERATION, "storeEncryptedWalletJWK()");

  // This password is only used for the current session. As soon as the page is reloaded, the wallet(s)' private key
  // must be reconstructed using the authShare and the deviceShare and added to the ExtensionStorage object again,
  // using a different random password:

  let randomPassword: string = "";

  do {
    randomPassword = generateRandomPassword();
  } while (!checkPasswordValid(randomPassword));

  await setDecryptionKey(randomPassword);

  // TODO: Consider calling this periodically to rotate the random passwords. We might need to use a Mutex for this...
  // updatePassword(randomPassword);

  return addWallet(jwk, randomPassword);
}

function isJWK(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const requiredKeys = ["n", "e", "d", "p", "q", "dp", "dq", "qi"];
  return requiredKeys.every((key) => key in obj);
}

function isSeedPhrase(obj: unknown): boolean {
  try {
    isValidMnemonic(obj as string);
    return true;
  } catch (e) {
    return false;
  }
}

export const WalletUtils = {
  // Generation:
  generateSeedPhrase,
  generateWalletJWK,
  generateWalletWorkShares,
  generateWalletRecoveryShares,
  generateWalletJWKFromShares,
  generateShareHash,
  generateShareHashAndPublicKey,
  generateShareHashAndPrivateKey,

  // Getters:
  getDeviceSharesForUser,

  // Storage:
  storeDeviceShare,
  removeDeviceShare,
  storeEncryptedSeedPhrase,
  hasEncryptedSeedPhrase,
  getDecryptedSeedPhrase,
  storeEncryptedRecoveryShare,
  hasEncryptedRecoveryShare,
  getDecryptedRecoveryShare,
  storeEncryptedWalletJWK,

  // Validation:
  isJWK,
  isSeedPhrase
};

// Stored seedphrases and recovery shares are removed if the feature flags are disabled:
if (!EMBEDDED_FEATURE_FLAGS.STORE_SEED_PHRASE) {
  (async () => {
    const storage = await LocalStorage.getInstance();
    const keys = storage.keys();
    for (const key of keys) {
      if (key.startsWith(ENCRYPTED_SEED_PHRASE_KEY)) {
        storage.removeItem(key);
      }
    }
  })();
}

// Cleanup for recovery shares if feature is disabled
if (!EMBEDDED_FEATURE_FLAGS.STORE_RECOVERY_SHARES) {
  (async () => {
    const storage = await LocalStorage.getInstance();
    const keys = storage.keys();
    for (const key of keys) {
      if (key.startsWith(ENCRYPTED_RECOVERY_SHARE_KEY)) {
        storage.removeItem(key);
      }
    }
  })();
}
