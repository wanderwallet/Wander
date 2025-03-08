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
import { requestUserAuthorization } from "~utils/auth/auth.utils";

const background: BackgroundModuleFunction<string | Uint8Array> = async (
  appData,
  data: unknown,
  options: Record<string, unknown>
) => {
  // validate data
  isRawArrayBuffer(data);

  // override with byte array
  data = new Uint8Array(Object.values(data));

  isArrayBuffer(data);

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(decryptedWallet);

  // parse private key jwk
  const privateKey = {
    ...decryptedWallet.keyfile,
    alg: "RSA-OAEP-256",
    ext: true
  };

  // remove wallet from memory
  freeDecryptedWallet(decryptedWallet.keyfile);

  let decryptedData: Uint8Array<ArrayBufferLike>;

  if (options.algorithm) {
    // validate
    isLegacyEncryptionOptions(options);

    // old Wander algorithm
    const key = await crypto.subtle.importKey(
      "jwk",
      privateKey,
      {
        name: options.algorithm,
        hash: {
          name: options.hash
        }
      },
      false,
      ["decrypt"]
    );

    // prepare encrypted data
    const encryptedKey = new Uint8Array(
      new Uint8Array(Object.values(data)).slice(0, 512)
    );
    const encryptedData = new Uint8Array(
      new Uint8Array(Object.values(data)).slice(512)
    );

    // create arweave client
    const arweave = new Arweave(defaultGateway);

    // decrypt key
    const decryptedKey = await crypto.subtle.decrypt(
      { name: options.algorithm },
      key,
      encryptedKey
    );

    // decrypt data
    decryptedData = await arweave.crypto.decrypt(
      encryptedData,
      new Uint8Array(decryptedKey),
      options.salt
    );

    // remove wallet from memory
    freeDecryptedWallet(privateKey);

    // if a salt is present, split it from the decrypted string
    if (options.salt) {
      const rawSalt = new TextEncoder().encode(options.salt);

      decryptedData = decryptedData.slice(
        0,
        decryptedData.length - rawSalt.length
      );
    }
  } else if (options.name) {
    // validate
    isEncryptionAlgorithm(options);

    // standard RSA decryption
    const key = await crypto.subtle.importKey(
      "jwk",
      privateKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(options, key, data);

    // remove wallet from memory
    freeDecryptedWallet(privateKey);

    decryptedData = new Uint8Array(decrypted);
  } else {
    // remove wallet from memory
    freeDecryptedWallet(privateKey);

    throw new Error("Invalid options passed", options);
  }

  // request "decrypt" popup
  await requestUserAuthorization(
    {
      type: "decrypt",
      message: Object.values(decryptedData)
    },
    appData
  );

  return decryptedData;
};

export default background;
