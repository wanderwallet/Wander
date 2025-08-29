import type { SignMessageOptions } from "../sign_message/types.js";
import type { ModuleFunction } from "../../module";
import { isArrayBuffer } from "../../../utils/assertions/assertions.js";
import { TransformFinalizer } from "../../foreground/foreground-modules.js";

const foreground: ModuleFunction<any[]> = (data: ArrayBuffer, options: SignMessageOptions) => {
  // validate
  isArrayBuffer(data);

  return [Object.values(data), options];
};

export const finalizer: TransformFinalizer<number[], any, any> = (result) => new Uint8Array(result);

export default foreground;
