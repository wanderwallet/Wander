import { isArrayBuffer } from "util/types";
import { isNumberArray, isSignMessageOptions, isLocalWallet } from "../../../utils/assertions/assertions";
import { getActiveKeyfile } from "../../../wallets";
import { freeDecryptedWallet } from "../../../wallets/encryption";
import type { BackgroundModuleFunction } from "../../background/background-modules";
import Arweave from "arweave";

const background: BackgroundModuleFunction<number[]> = async (appData, data: unknown, options: unknown) => {
  // validate input
  isNumberArray(data);
  isSignMessageOptions(options);

  // uint8array data to hash
  const dataToHash = new Uint8Array(data);

  isArrayBuffer(dataToHash);

  // get user wallet
  const activeWallet = await getActiveKeyfile(appData);

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(activeWallet);

  // hash using the private exponent
  const hash = await crypto.subtle.digest(
    options.hashAlgorithm,
    Arweave.utils.concatBuffers([dataToHash.buffer, new TextEncoder().encode(activeWallet.keyfile.d)]),
  );

  // clean up wallet from memory
  freeDecryptedWallet(activeWallet.keyfile);

  return Array.from(new Uint8Array(hash));
};

export default background;
