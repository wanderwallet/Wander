import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { getActiveKeyfile } from "~wallets";

const background: BackgroundModuleFunction<string> = async (appData) => {
  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  // hardware wallet
  if (decryptedWallet.type === "hardware") {
    return decryptedWallet.publicKey;
  }

  const keyfile = decryptedWallet.keyfile;

  // get public key
  const { n: publicKey } = keyfile;

  // remove wallet from memory
  freeDecryptedWallet(keyfile);

  return publicKey;
};

export default background;
