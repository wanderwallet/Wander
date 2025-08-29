import type { SignMessageOptions } from "../sign_message/types.js";
import type { ModuleFunction } from "../../module";
import { isArrayBuffer } from "~utils/assertions";
import Arweave from "arweave";

const foreground: ModuleFunction<any[]> = (
  data: ArrayBuffer,
  signature: ArrayBuffer | string,
  publicKey?: string,
  options?: SignMessageOptions,
) => {
  // validate
  isArrayBuffer(data);

  if (typeof signature === "string") {
    signature = Arweave.utils.b64UrlToBuffer(signature);
  }

  isArrayBuffer(signature);

  return [Object.values(data), Object.values(signature), publicKey, options];
};

export default foreground;
