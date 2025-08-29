import browser from "webextension-polyfill";
import { removeDecryptionKey } from "../../../../../wallets/auth";

/**
 * Listener for browser close.
 * On browser closed, we remove the
 * decryptionKey.
 */
export async function handleWindowClose() {
  const windows = await browser.windows.getAll();

  // TODO: Maybe we should be counting connected apps instead?
  // return if there are still windows open
  if (windows.length > 0) {
    return;
  }

  // remove the decryption key
  await removeDecryptionKey();
}
