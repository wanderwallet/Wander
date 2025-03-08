export function isError(data: unknown): data is Error {
  return data instanceof Error;
}

export function getFriendlyErrorMessage(maybeError: unknown): string | boolean {
  // TODO: This needs to be implemented properly, either with a custom error class that includes a `friendlyErrorMessage`
  // property or mapping `error.name` or similar to i18n values.

  return isError(maybeError) ? true : !!maybeError;
}

/**
 * For future reference, here are some error types that can be used:
 *
 * "Not found": Something was queried/mapped/loaded but was not there.
 * "Missing": Something should have been provided/set, but wasn't.
 * "Unexpected": Something was provided, but the value wasn't right.
 *  */

export enum ErrorTypes {
  Error = "Error",
  RangeError = "RangeError",
  ReferenceError = "ReferenceError",
  SyntaxError = "SyntaxError",
  URIError = "URIError",
  PageNotFound = "Page not found",
  MissingSettingsType = "Missing settings type",
  UnexpectedSettingsType = "Unexpected settings type",
  SettingsNotFound = "Settings not found",
  WalletNotFound = "Wallet not found",
  TokenNotFound = "Token not found",
  MissingTxId = "Transaction ID not found"
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class BalanceFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceFetchError";
  }
}

export const isNetworkError = (error: any) =>
  error?.message === "Failed to fetch" ||
  error?.message?.includes("ERR_SSL_PROTOCOL_ERROR") ||
  error?.message?.includes("ERR_CONNECTION_CLOSED");
