import {
  ArweaveSigner,
  DataItem,
  Signer,
  createData,
  type DataItemCreateOptions
} from "@dha-team/arbundles";

export interface SignerConfig {
  signatureType: number;
  signatureLength: number;
  ownerLength: number;
  publicKey: Buffer;
}

class DummySigner implements Signer {
  publicKey: Buffer;
  signatureType: number;
  signatureLength: number;
  ownerLength: number;
  pem?: string | Buffer;
  constructor(signerConfig: SignerConfig) {
    this.publicKey = signerConfig.publicKey;
    this.signatureLength = signerConfig.signatureLength;
    this.signatureType = signerConfig.signatureType;
    this.ownerLength = signerConfig.ownerLength;
  }
  sign(message: Uint8Array, _opts?: any): Uint8Array | Promise<Uint8Array> {
    throw new Error("Method not implemented.");
  }
}

export const createDataItem = (
  binary: Uint8Array,
  signerConfig: SignerConfig,
  options: DataItemCreateOptions
): DataItem => {
  return createData(binary, new DummySigner(signerConfig), options);
};
