import type { HttpStatusCode } from "axios";
import type { trpcVanilla } from "~utils/embedded/embedded.utils";

export interface TRPCErrorData {
  code: string;
  httpStatus: HttpStatusCode;
  stack: string;
  path: keyof typeof trpcVanilla;
}

export interface TRPCError {
  code: number;
  message: string;
  data: TRPCErrorData;
}

export class TRPCClientError extends Error {
  meta: {
    response: Response;
    responseJSON: any;
  };

  shape: TRPCError;

  data: TRPCErrorData;
}

export function isTRPCClientError(err: unknown): err is TRPCClientError {
  const data = (err ? (err as any).data || {} : {}) as TRPCErrorData;

  return (
    err instanceof Error &&
    err.hasOwnProperty("meta") &&
    err.hasOwnProperty("shape") &&
    err.hasOwnProperty("data") &&
    typeof data.code === "string" &&
    typeof data.httpStatus === "number" &&
    typeof data.stack === "string" &&
    typeof data.path === "string"
  );
}
