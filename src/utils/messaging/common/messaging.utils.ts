import type { ApiErrorResponse } from "shim";

export function isApiErrorResponse<T>(
  input: unknown
): input is ApiErrorResponse {
  return (
    !!input &&
    typeof input === "object" &&
    /^wander(Embedded)?$/.test((input as ApiErrorResponse).app) &&
    !!(input as ApiErrorResponse).error
  );
}
