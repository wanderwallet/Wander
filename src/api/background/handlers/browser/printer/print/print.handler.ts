import { WANDER_PRINTER_ID } from "~api/background/handlers/browser/printer/printer.constants";
import { uploadDataToTurbo } from "~api/modules/dispatch/uploader";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { createData, ArweaveSigner } from "arbundles";
import { concatGatewayURL } from "~gateways/utils";
import { findGateway } from "~gateways/wayfinder";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { signAuth } from "~api/modules/sign/sign_auth";
import { getActiveTab } from "~applications";
import { sleep } from "~utils/promises/sleep";

/**
 * Print request (result) callback
 */
type PrintCallback = (result: string) => void;

/**
 * Handles the request from the user to print the page to Arweave
 */
export async function handlePrint(
  printJob: chrome.printerProvider.PrintJob,
  resultCallback: PrintCallback
) {
  // only print for the Wander printer
  if (printJob.printerId !== WANDER_PRINTER_ID) return;

  // wallet
  let decryptedWallet: DecryptedWallet;

  try {
    // build data blog
    const data = new Blob([printJob.document], { type: printJob.contentType });

    // get user wallet
    decryptedWallet = await getActiveKeyfile();

    if (decryptedWallet.type === "hardware")
      throw new Error("Cannot print with a hardware wallet.");

    // extension manifest
    const manifest = browser.runtime.getManifest();

    // setup tags
    const tags = [
      { name: "App-Name", value: manifest.name },
      { name: "App-Version", value: manifest.version },
      { name: "Type", value: "Print-Archive" },
      { name: "Content-Type", value: printJob.contentType },
      { name: "print:title", value: printJob.title },
      { name: "print:timestamp", value: new Date().getTime().toString() }
    ];

    let transactionId: string;

    // find a gateway to upload and display the result
    const gateway = await findGateway({});
    const arweave = Arweave.init(gateway);

    // create data item
    const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);
    const transactionData = new Uint8Array(await data.arrayBuffer());
    const dataEntry = createData(transactionData, dataSigner, { tags });

    // calculate reward for the transaction
    const reward = await arweave.transactions.getPrice(
      transactionData.byteLength
    );

    // get active tab
    const activeTab = await getActiveTab();

    await signAuth(
      {
        tabID: activeTab.id,
        url: activeTab.url
      },
      // @ts-expect-error
      {
        ...dataEntry.toJSON(),
        reward,
        sizeInBytes: transactionData.byteLength
      },
      decryptedWallet.address
    );

    try {
      // sign an upload data
      await dataEntry.sign(dataSigner);
      await uploadDataToTurbo(dataEntry, "https://turbo.ardrive.io");

      await sleep(2000);

      // this has to be one of FAILED, INVALID_DATA, INVALID_TICKET, OK
      resultCallback("OK");

      transactionId = dataEntry.id;
    } catch (error) {
      // sign & post if there is something wrong with turbo

      const transaction = await arweave.createTransaction(
        { data: transactionData },
        decryptedWallet.keyfile
      );

      for (const tag of tags) {
        transaction.addTag(tag.name, tag.value);
      }

      // sign and upload
      await arweave.transactions.sign(transaction, decryptedWallet.keyfile);
      const uploader = await arweave.transactions.getUploader(transaction);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }

      await sleep(2000);

      // this has to be one of FAILED, INVALID_DATA, INVALID_TICKET, OK
      resultCallback("OK");

      transactionId = transaction.id;
    }

    // open in new tab
    await chrome.tabs.create({
      url: `${concatGatewayURL(gateway)}/${transactionId}`
    });
  } catch (e) {
    console.log("Printing failed:\n", e);
    resultCallback("FAILED");
  }

  // free wallet from memory
  if (decryptedWallet?.type == "local")
    freeDecryptedWallet(decryptedWallet.keyfile);
}
