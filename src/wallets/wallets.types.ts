import type { HardwareWallet } from "./hardware";

/**
 * Locally stored wallet
 *
 * KeyfileFormat - string(encrypted) / JWKInterface(decrypted)
 */
export interface LocalWallet<KeyfileFormat = string> {
  type: "local";
  nickname: string;
  address: string;
  keyfile: KeyfileFormat;
}

/**
 * KeyfileFormat - string(encrypted) / JWKInterface(decrypted)
 */
export type StoredWallet<KeyfileFormat = string> =
  | LocalWallet<KeyfileFormat>
  | HardwareWallet;
