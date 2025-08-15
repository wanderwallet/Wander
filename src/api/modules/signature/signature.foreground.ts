import type { TransformFinalizer } from "~api/foreground/foreground-modules";
import type { ModuleFunction } from "~api/module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<any[]> = (
  data: Uint8Array,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
) => {
  console.warn(
    "Warning: The signature API is deprecated and it will be removed.\nVisit https://docs.wander.app/api/signature for alternatives.",
  );

  return [Object.values(data), algorithm];
};

export const finalizer: TransformFinalizer<number[], any, any> = (result) => new Uint8Array(result);

export default foreground;
