import type { TransformFinalizer } from "~api/foreground/foreground-modules";
import type { ModuleFunction } from "~api/module";
import type { RawDataItem, SignDataItemParams } from "./types";
import { isArrayBuffer } from "~utils/assertions";
import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";

const foreground: ModuleFunction<Record<any, any>> = async (
  dataItem: SignDataItemParams,
  signatureOptions?: SignatureOptions,
) => {
  let rawDataItem: RawDataItem;

  // validate
  if (typeof dataItem.data !== "string") {
    isArrayBuffer(dataItem.data);

    rawDataItem = {
      ...dataItem,
      data: Array.from(dataItem.data),
    };
  } else {
    rawDataItem = {
      ...dataItem,
      data: Array.from(new TextEncoder().encode(dataItem.data)),
    };
  }

  return [rawDataItem, signatureOptions];
};

export const finalizer: TransformFinalizer<number[]> = (result) => {
  const dataItem = new Uint8Array(result);

  return dataItem.buffer;
};

export default foreground;
