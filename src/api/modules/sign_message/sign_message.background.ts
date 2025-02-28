import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { getActiveKeyfile } from "~wallets";
import {
  isArrayBuffer,
  isNumberArray,
  isSignMessageOptions
} from "~utils/assertions";
import { signAuthKeystone, type AuthKeystoneData } from "../sign/sign_auth";
import Arweave from "arweave";
import { requestUserAuthorization } from "~utils/auth/auth.utils";
import { checkIfUserNeedsToSign } from "../sign/sign_policy";
import Application from "~applications/application";

const background: BackgroundModuleFunction<number[]> = async (
  appData,
  data: unknown,
  options = { hashAlgorithm: "SHA-256" }
) => {
  // validate input
  isNumberArray(data);
  isSignMessageOptions(options);

  // uint8array data to sign
  const dataToSign = new Uint8Array(data);

  isArrayBuffer(dataToSign);

  // get user wallet
  const activeWallet = await getActiveKeyfile(appData);

  const app = new Application(appData.url);
  const signPolicy = await app.getSignPolicy();

  const alwaysAsk = checkIfUserNeedsToSign(
    signPolicy,
    undefined,
    activeWallet?.type
  );

  if (alwaysAsk) {
    await requestUserAuthorization(
      {
        type: "signature",
        message: data
      },
      appData
    );
  }

  // hash the message
  const hash = await crypto.subtle.digest(options.hashAlgorithm, dataToSign);

  // ensure that the currently selected
  // wallet is not a local wallet
  if (activeWallet.type === "local") {
    // get signing key using the jwk
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      activeWallet.keyfile,
      {
        name: "RSA-PSS",
        hash: options.hashAlgorithm
      },
      false,
      ["sign"]
    );

    // hashing 2 times ensures that the app is not draining the user's wallet
    // credits to Arweave.app
    const signature = await crypto.subtle.sign(
      { name: "RSA-PSS", saltLength: 32 },
      cryptoKey,
      hash
    );

    // remove wallet from memory
    freeDecryptedWallet(activeWallet.keyfile);

    return Array.from(new Uint8Array(signature));
  } else {
    const data: AuthKeystoneData = {
      type: "Message",
      data: dataToSign
    };
    const res = await signAuthKeystone(appData, data);
    const sig = Arweave.utils.b64UrlToBuffer(res.data.signature);
    return Array.from(sig);
  }
};

export default background;
