import type { ModuleFunction } from "~api/module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<void> = () => {};

export default foreground;
