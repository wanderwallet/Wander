import Arweave from "arweave";
import { getActiveKeyfile } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { createData, ArweaveSigner } from "arbundles";
import { uploadDataToTurbo } from "~api/modules/dispatch/uploader";

const MAX_FILE_SIZE = 500 * 1024; // 500KB

const arweave = new Arweave({
  host: "ar-io.net",
  port: 443,
  protocol: "https"
});

function toArrayBuffer(data: any) {
  return new Promise((resolve, _) => {
    const fr = new FileReader();

    fr.onload = function () {
      resolve(this.result);
    };

    fr.readAsArrayBuffer(data);
  });
}

export async function uploadUserAvatar(avatar: File) {
  if (avatar.size > MAX_FILE_SIZE) {
    throw new Error("Avatar size exceeds the maximum limit of 500KB");
  }

  const wallet = await getActiveKeyfile();

  if (wallet.type === "hardware") {
    return;
  }
  const keyfile = wallet.keyfile;

  const node = "https://turbo.ardrive.io";

  try {
    const arrayBuffer = (await toArrayBuffer(avatar)) as ArrayBuffer;
    const data = new Uint8Array(arrayBuffer);
    const dataSigner = new ArweaveSigner(keyfile);
    const tags = [
      { name: "App-Name", value: "Wander" },
      { name: "Content-Type", value: avatar.type },
      { name: "Type", value: "avatar-update" }
    ];

    const dataEntry = createData(data, dataSigner, { tags });
    await dataEntry.sign(dataSigner);
    await uploadDataToTurbo(dataEntry, node);

    // remove wallet from memory
    freeDecryptedWallet(keyfile);

    // return transaction id
    return dataEntry.id;
  } catch (error) {
    console.log("Unable to upload avatar", error);
  }
}

export const getUserAvatar = async (txId: string) => {
  try {
    const data = await arweave.transactions.getData(txId, { decode: true });
    let mimeType = "image/png";

    const buffer = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

    if (buffer instanceof Uint8Array) {
      const textDecoder = new TextDecoder("utf-8");
      const snippet = textDecoder.decode(buffer.slice(0, 80));

      if (snippet.includes("<svg")) {
        mimeType = "image/svg+xml";
      }
    }

    const blob = new Blob([buffer], { type: mimeType });
    const imageUrl = blob ? URL.createObjectURL(blob) : null;
    return imageUrl;
  } catch (e) {
    console.error("Error fetching avatar:", e);
    return null;
  }
};
