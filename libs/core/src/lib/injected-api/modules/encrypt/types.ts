/** Webcrypto encryption algorithm */
export type EncryptionAlgorithm = AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams;

/** Legacy options for encryption */
export interface LegacyEncryptionOptions {
  algorithm: string;
  hash: string;
  salt?: string;
}
