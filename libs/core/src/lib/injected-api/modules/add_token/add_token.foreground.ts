import type { ModuleFunction } from "~api/module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<unknown[]> = (id: unknown, type?: unknown, dre_node?: unknown) => {
  if (dre_node && typeof dre_node !== "string") {
    dre_node = undefined;
    console.warn("Gateway is deprecated for tokens. Provide a DRE node instead.");
  }

  return [id, type, dre_node];
};

export default foreground;
