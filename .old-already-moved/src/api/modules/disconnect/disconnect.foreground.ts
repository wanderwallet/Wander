import type { ModuleFunction } from "~api/module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<void> = () => {};

// dispatch undefined wallet address event
export const finalizer: ModuleFunction<void> = () => {
  // dispatch custom event
  dispatchEvent(
    new CustomEvent("walletSwitch", {
      detail: { address: undefined },
    }),
  );
};

export default foreground;
