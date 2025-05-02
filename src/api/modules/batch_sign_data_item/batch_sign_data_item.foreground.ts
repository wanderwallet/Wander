import type { TransformFinalizer } from "~api/foreground/foreground-modules";
import type { ModuleFunction } from "~api/module";
import type { RawDataItem, SignDataItemParams } from "../sign_data_item/types";
import { isArrayBuffer } from "~utils/assertions";
import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";

const MAX_TOTAL_SIZE = 200 * 1024;

const foreground: ModuleFunction<Record<any, any>[]> = async (
  dataItems: SignDataItemParams[],
  signatureOptions?: SignatureOptions
) => {
  if (!Array.isArray(dataItems)) {
    throw new Error("Input must be an array of data items");
  }

  const totalSize = dataItems.reduce((acc, dataItem) => {
    const dataSize =
      typeof dataItem.data === "string"
        ? new TextEncoder().encode(dataItem.data).length
        : dataItem.data.length;
    return acc + dataSize;
  }, 0);

  if (totalSize > MAX_TOTAL_SIZE) {
    throw new Error("Total size of data items exceeds 200 KB");
  }

  const rawDataItems: RawDataItem[] = dataItems.map((dataItem) => {
    let rawDataItem: RawDataItem;

    if (typeof dataItem.data !== "string") {
      isArrayBuffer(dataItem.data);

      rawDataItem = {
        ...dataItem,
        data: Array.from(dataItem.data)
      };
    } else {
      rawDataItem = {
        ...dataItem,
        data: Array.from(new TextEncoder().encode(dataItem.data))
      };
    }

    return rawDataItem;
  });

  return [rawDataItems, signatureOptions];
};

export const finalizer: TransformFinalizer<number[][]> = (result) => {
  return result.map((item) => new Uint8Array(item).buffer);
};

export default foreground;
