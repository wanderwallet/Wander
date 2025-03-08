import { type TransformFinalizer } from "~api/foreground/foreground-modules";
import type { ModuleFunction } from "~api/module";

const foreground: ModuleFunction<unknown> = (data, options) => {
  if (options.algorithm) {
    console.warn(
      '[Wander] YOU\'RE USING DEPRECATED PARAMS FOR "decrypt()". Please check the documentation.\nhttps://github.com/arconnectio/Wander#decryptdata-options-promisestring'
    );
  }

  return [new Uint8Array(data), options];
};

export const finalizer: TransformFinalizer<Record<any, any>, any, any> = (
  result
) => new Uint8Array(Object.values(result));

export default foreground;
