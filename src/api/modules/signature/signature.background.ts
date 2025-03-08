import { isArray, isArrayOfType, isNumber, isString } from "typed-assert";
import { freeDecryptedWallet } from "~wallets/encryption";
import { isSignatureAlgorithm } from "~utils/assertions";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { getActiveKeyfile } from "~wallets";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";
import Application from "~applications/application";
import { checkIfUserNeedsToSign } from "../sign/sign_policy";

const background: BackgroundModuleFunction<number[]> = async (
  appData,
  data: unknown,
  algorithm: unknown
) => {
  // validate
  isString(appData?.url, "Application URL is undefined.");
  isArray(data, "Data has to be an array.");
  isArrayOfType(data, isNumber, "Data has to be an array of numbers.");
  isSignatureAlgorithm(algorithm);

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  const app = new Application(appData.url);
  const signPolicy = await app.getSignPolicy();

  const alwaysAsk = checkIfUserNeedsToSign(
    signPolicy,
    undefined,
    decryptedWallet?.type,
    "signature"
  );

  // request user to authorize
  if (alwaysAsk) {
    try {
      await requestUserAuthorization(
        {
          type: "signature",
          message: data
        },
        appData
      );
    } catch {
      throw new Error("User rejected the signature request");
    }
  }

  // check if hardware wallet
  if (decryptedWallet.type === "hardware") {
    throw new Error(
      "Active wallet type: hardware. This does not support signature currently."
    );
  }

  const keyfile = decryptedWallet.keyfile;

  // get signing key using the jwk
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    keyfile,
    {
      name: "RSA-PSS",
      hash: {
        name: "SHA-256"
      }
    },
    false,
    ["sign"]
  );

  // uint8array data to sign
  const dataToSign = new Uint8Array(data);

  // grab signature
  const signature = await crypto.subtle.sign(algorithm, cryptoKey, dataToSign);

  // remove wallet from memory
  freeDecryptedWallet(keyfile);

  return Array.from(new Uint8Array(signature));
};

export default background;
