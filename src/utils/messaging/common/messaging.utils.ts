import type { ApiErrorResponse, ApiResponse } from "shim";

export function isApiResponse<T>(input: unknown): input is ApiResponse<T> {
  return (
    !!input &&
    typeof input === "object" &&
    input.hasOwnProperty("callID") &&
    input.hasOwnProperty("type") &&
    input.hasOwnProperty("data")
  );
}

export function isApiErrorResponse<T>(
  input: unknown
): input is ApiErrorResponse {
  return isApiResponse(input) && !!(input as ApiErrorResponse).error;
}
