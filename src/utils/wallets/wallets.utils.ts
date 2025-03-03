import * as bip39 from "bip39-web-crypto";
import { addWallet, getWalletKeyLength, type WalletKeyLengths } from "~wallets";
import {
  checkPasswordValid,
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
import { random, pki, asn1 } from "node-forge";
import {
  pemToBase64,
  pemToJWK,
  privateKeyDerToJWK
} from "~utils/crypto/crypto.utils";
import type { Wallet } from "~utils/embedded/embedded.types";
import { EMBEDDED_FEATURE_FLAGS } from "~utils/embedded/embedded.constants";

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
        prng: sharePrng
      },
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          const shareHash = await generateShareHash(share);
          const publicKey = result.publicKey;
          const publicKeyPEM = pki.publicKeyToPem(publicKey);
          const sharePublicKey = pemToBase64(publicKeyPEM);

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
        prng: sharePrng
      },
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          const shareHash = await generateShareHash(share);
          const privateKey = result.privateKey;
          //const privateKeyPEM = pki.privateKeyToPem(privateKey);
          //const sharePrivateKeyJWK = await pemToJWK(privateKeyPEM);

          // Convert a Forge private key to an ASN.1 RSAPrivateKey:
          const rsaPrivateKey = pki.privateKeyToAsn1(privateKey);
          const der = asn1.toDer(rsaPrivateKey).getBytes();
          const sharePrivateKeyJWK = await privateKeyDerToJWK(der).catch(
            (err) => {
              console.warn(`Error generating private key JWK from share:`, err);

              return null;
            }
          );

          // See https://github.com/digitalbazaar/forge/issues/256

          // TODO: Test signatures work:

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

function loadDeviceSharesByUser(): DeviceSharesByUser {
  try {
    let deviceSharesInfo = JSON.parse(
      localStorage.getItem(DEVICE_SHARES_INFO_KEY)
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

let _deviceSharesByUser: DeviceSharesByUser = loadDeviceSharesByUser();

// Getters:

function getDeviceSharesForUser(userId: string): DeviceShares {
  return _deviceSharesByUser[userId] || {};
}

// Storage:

const ENCRYPTED_SEED_PHRASE_KEY = "ENCRYPTED_SEED_PHRASE";

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

  localStorage.setItem(
    `${ENCRYPTED_SEED_PHRASE_KEY}-${walletId}`,
    encryptedSeedPhrase
  );
}

function hasEncryptedSeedPhrase(walletId: string) {
  return !!localStorage.getItem(`${ENCRYPTED_SEED_PHRASE_KEY}-${walletId}`);
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

  const encryptedSeedPhrase = localStorage.getItem(
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

function storeDeviceShare(wallet: Wallet, userId: string) {
  log(LOG_GROUP.WALLET_GENERATION, "storeDeviceShare()");

  if (!_deviceSharesByUser[userId]) _deviceSharesByUser[userId] = {};

  _deviceSharesByUser[userId][wallet.id] = wallet.deviceShare;

  localStorage.setItem(
    DEVICE_SHARES_INFO_KEY,
    JSON.stringify(_deviceSharesByUser)
  );
}

function removeDeviceShare(walletId: string, userId: string) {
  log(LOG_GROUP.WALLET_GENERATION, "storeDeviceShare()");

  if (!_deviceSharesByUser[userId]) _deviceSharesByUser[userId] = {};

  delete _deviceSharesByUser[userId][walletId];

  localStorage.setItem(
    DEVICE_SHARES_INFO_KEY,
    JSON.stringify(_deviceSharesByUser)
  );
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
  storeEncryptedWalletJWK
};

// Stored seedphrase are removed if the `STORE_SEED_PHRASE` flag becomes false:
if (!EMBEDDED_FEATURE_FLAGS.STORE_SEED_PHRASE) {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(ENCRYPTED_SEED_PHRASE_KEY)) {
      localStorage.removeItem(key);
    }
  });
}
