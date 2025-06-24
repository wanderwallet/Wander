import Arweave from "arweave";
import { getActiveKeyfile } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { createData, ArweaveSigner } from "@dha-team/arbundles";
import { uploadDataToTurbo } from "~api/modules/dispatch/uploader";
import { QueryClient } from "@tanstack/react-query";

// Create a new query client instance for avatar fetching
const avatarQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const MAX_FILE_SIZE = 500 * 1024; // 500KB

const arweave = new Arweave({
  host: "ar-io.net",
  port: 443,
  protocol: "https",
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
      { name: "Type", value: "avatar-update" },
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

const fetchAvatarData = async (txId: string): Promise<string | null> => {
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
    return blob ? URL.createObjectURL(blob) : null;
  } catch (error) {
    console.error(`Failed to fetch avatar data for tx ${txId}:`, error);
    return null;
  }
};

/**
 * Fetches and caches an avatar image from Arweave using the transaction ID.
 * The result is cached for 5 minutes.
 *
 * @param txId - The Arweave transaction ID of the avatar image
 * @returns A promise that resolves to the image URL or null if not found
 */
export const getUserAvatar = async (txId: string): Promise<string | null> => {
  if (!txId) return null;

  try {
    const result = await avatarQueryClient
      .fetchQuery({
        queryKey: ["avatar", txId],
        queryFn: () => fetchAvatarData(txId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        gcTime: 5 * 60 * 1000, // 5 minutes cache time
      })
      .catch((error) => {
        console.error(`Error in avatar query for tx ${txId}:`, error);
        return null;
      });

    return result ?? null;
  } catch (e) {
    console.error(`Unexpected error in getUserAvatar for tx ${txId}:`, e);
    return null;
  }
};
