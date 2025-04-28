import type { DataItem } from "@dha-team/arbundles";
import { defaultBundler, pricingEndpoint } from "~applications/application";

/**
 * Upload a data entry to a Bundlr node
 *
 * @param dataItem Data entry to upload
 * @param node Bundlr node to upload to
 * @returns Bundlr node response
 */
export async function uploadDataToTurbo(dataItem: DataItem, node: string) {
  const res = await fetch(`${node}/tx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream"
    },
    body: dataItem.getRaw()
  });

  if (res.status >= 400)
    throw new Error(
      `Error uploading DataItem: ${res.status} ${res.statusText}`
    );
}

/**
 * Get the price of a data item from a
 * Bundlr node in winstons
 */
export async function getPrice(dataItem: DataItem, node: string) {
  // get data item size
  const size = dataItem.getRaw().length;

  // fetch price
  let endpoint;
  if (node === defaultBundler) {
    endpoint = pricingEndpoint;
  } else {
    endpoint = node;
  }
  const res = await fetch(`${endpoint}/price/arweave/${size}`);

  if (res.status >= 400)
    throw new Error(`Error fetching price: ${res.status} ${res.statusText}`);

  return parseInt(await res.text());
}
