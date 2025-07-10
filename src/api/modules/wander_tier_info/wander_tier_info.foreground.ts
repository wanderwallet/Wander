import type { ModuleFunction } from "~api/module";

/**
 * Wander tier API foreground module
 * No parameter transformation needed - simply returns active tier
 */
const foreground: ModuleFunction<void> = () => {
  // No parameters needed for getting active tier
};

export default foreground;
