import type { ModuleFunction } from "~api/module";

// pass through parameters to background
const foreground: ModuleFunction<[string]> = (id: string) => [id];

export default foreground;
