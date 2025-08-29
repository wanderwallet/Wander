import type { TransformFinalizer } from "~api/foreground/foreground-modules";
import type { SignMessageOptions } from "./types.js";
import type { ModuleFunction } from "../../module";
import { isArrayBuffer } from "~utils/assertions";

const foreground: ModuleFunction<any[]> = (data: ArrayBuffer, options?: SignMessageOptions) => {
  // validate
  isArrayBuffer(data);

  return [Object.values(data), options];
};

export const finalizer: TransformFinalizer<number[], any, any> = (result) => new Uint8Array(result);

export default foreground;
