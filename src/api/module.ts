import type { PermissionType } from "~applications/permissions";

/**
 * Why do we need separate modules?
 * We don't want to include background functions in the injected
 * script or functions from the injected script in the backgroud
 * script. Tree shaking is not going to separate these functions,
 * so instead we are handling them in two different files (foreground
 * and background module files) so we can import them separately.
 */

/**
 * Basic API module props interface
 */
export interface ModuleProperties {
  /** The name the function will be injected with into the API */
  functionName: string;
  /** Permissions required to execute this function */
  permissions: PermissionType[];
}

/**
 * Function type for background and injected script API functions
 */
export type ModuleFunction<ResultType> = (...params: any[]) => Promise<ResultType> | ResultType;

/** Full API module (background/foreground) */
export interface Module<T> extends ModuleProperties {
  function: ModuleFunction<T>;
}
