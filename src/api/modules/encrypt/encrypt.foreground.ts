import type { TransformFinalizer } from "~api/foreground/foreground-modules";
import type { ModuleFunction } from "~api/module";

const foreground: ModuleFunction<unknown> = (data, options) => {
  if (options.algorithm) {
    console.warn(
      '[Wander] YOU\'RE USING DEPRECATED PARAMS FOR "encrypt()". Please check the documentation.\nhttps://github.com/arconnectio/Wander#encryptdata-options-promiseuint8array'
    );
  }

  return [typeof data === "string" ? data : new Uint8Array(data), options];
};

export const finalizer: TransformFinalizer<Record<any, any>, any, any> = (
  result
) => new Uint8Array(Object.values(result));

export default foreground;
