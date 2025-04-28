import {
  ArweaveSigner,
  getCryptoDriver,
  type JWKInterface
} from "@dha-team/arbundles";
import type { SignatureOptions } from "arweave/node/lib/crypto/crypto-interface";

export function createArweaveSignerWithOptions(
  keyfile: JWKInterface,
  signatureOptions: SignatureOptions
) {
  const dataSigner = new ArweaveSigner(keyfile);

  if (signatureOptions) {
    dataSigner.sign = function (message) {
      return getCryptoDriver().sign(this.jwk, message, signatureOptions) as any;
    };
  }

  return dataSigner;
}
