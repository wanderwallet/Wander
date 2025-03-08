import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { defaultGateway } from "~gateways/gateway";
import { getActiveKeyfile } from "~wallets";
import Arweave from "arweave";
import {
  isArrayBuffer,
  isEncryptionAlgorithm,
  isLegacyEncryptionOptions,
  isLocalWallet,
  isRawArrayBuffer
} from "~utils/assertions";

const background: BackgroundModuleFunction<Uint8Array> = async (
  appData,
  data: unknown,
  options: Record<string, unknown>
) => {
  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(decryptedWallet);

  const keyfile = decryptedWallet.keyfile;
  const publicKey = {
    kty: "RSA",
    e: "AQAB",
    n: keyfile.n,
    alg: "RSA-OAEP-256",
    ext: true
  };

  // remove wallet from memory
  freeDecryptedWallet(keyfile);

  if (options.algorithm) {
    // validate
    isLegacyEncryptionOptions(options);

    // old wander algorithm
    const key = await crypto.subtle.importKey(
      "jwk",
      publicKey,
      {
        name: options.algorithm,
        hash: {
          name: options.hash
        }
      },
      false,
      ["encrypt"]
    );

    // create arweave client
    const arweave = new Arweave(defaultGateway);

    let dataBuff: Uint8Array;

    if (typeof data === "string") {
      // string data is decrypted
      dataBuff = new TextEncoder().encode(data + (options.salt || ""));
    } else {
      // raw data is decrypted
      isRawArrayBuffer(data);

      dataBuff = arweave.utils.concatBuffers([
        new Uint8Array(Object.values(data)),
        new TextEncoder().encode(options.salt || "")
      ]);
    }

    // prepare data
    const keyBuff = new Uint8Array(256);

    crypto.getRandomValues(keyBuff);

    // encrypt data
    const encryptedData = await arweave.crypto.encrypt(
      dataBuff,
      keyBuff,
      options.salt
    );

    // encrypt key
    const encryptedKey = await crypto.subtle.encrypt(
      { name: options.algorithm },
      key,
      keyBuff
    );

    return arweave.utils.concatBuffers([encryptedKey, encryptedData]);
  } else if (options.name && typeof data !== "string") {
    // validate
    isEncryptionAlgorithm(options);
    isRawArrayBuffer(data);

    data = new Uint8Array(Object.values(data));

    isArrayBuffer(data);

    // standard RSA decryption
    const key = await crypto.subtle.importKey(
      "jwk",
      publicKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["encrypt"]
    );
    const encrypted = await crypto.subtle.encrypt(options, key, data);

    return new Uint8Array(encrypted);
  } else {
    // remove wallet from memory
    freeDecryptedWallet(keyfile);

    throw new Error("Invalid options passed", options);
  }
};

export default background;
