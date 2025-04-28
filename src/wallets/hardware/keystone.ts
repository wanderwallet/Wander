import {
  ArweaveCryptoAccount,
  ArweaveSignature,
  ArweaveSignRequest,
  SignType
} from "@keystonehq/bc-ur-registry-arweave";
import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import type Transaction from "arweave/web/lib/transaction";
import type { UR } from "@ngraveio/bc-ur";
import { v4 as uuid } from "uuid";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { Signer } from "@dha-team/arbundles";
import { EventEmitter } from "events";

export interface KeystoneInteraction {
  display(data: UR);
}

export class KeystoneSigner implements Signer {
  readonly signatureType: number = 1;
  readonly ownerLength: number = 512;
  readonly signatureLength: number = 512;
  #_event = new EventEmitter();
  public get publicKey(): Buffer {
    return this._publicKey;
  }

  constructor(
    private _publicKey: Buffer,
    private mfp: string,
    private signType: SignType,
    private interaction: KeystoneInteraction,
    private options: SignatureOptions = { saltLength: 32 }
  ) {}
  sign(message: Uint8Array, _opts?: any): Promise<Uint8Array> {
    const data = Buffer.from(message);
    const signRequest = ArweaveSignRequest.constructArweaveRequest(
      data,
      this.mfp,
      this.signType,
      this.options.saltLength
    );
    return new Promise(async (resolve) => {
      const ur = signRequest.toUR();
      this.interaction.display(ur);
      this.#_event.once("submit-signature", (signature) => {
        resolve(signature);
      });
    });
  }

  submitSignature(signature: string) {
    const signatureBytes = Buffer.from(signature, "base64");
    this.#_event.emit("submit-signature", signatureBytes);
  }
}

/**
 * Decode cbor result from a keystone QR code
 * with Arweave account info
 *
 * @returns Wallet address & public key
 */
export async function decodeAccount(res: UR): Promise<KeystoneAccount> {
  // check UR type
  if (res.type !== "arweave-crypto-account") {
    throw new Error(
      `Invalid UR result. Expected "arweave-crypto-account", received "${res.type}".`
    );
  }

  // decode cbor result
  const keyringData = ArweaveCryptoAccount.fromCBOR(res.cbor);

  // get owner
  const publicKey = keyringData.getKeyData();
  const owner = Arweave.utils.bufferTob64Url(publicKey);

  const xfp = keyringData.getMasterFingerprint().toString("hex");

  // get address
  const arweave = new Arweave(defaultGateway);
  const address = await arweave.wallets.ownerToAddress(owner);

  return {
    address,
    owner,
    xfp
  };
}

/**
 * Convert an Arweave transaction to an UR object
 * to be encoded into a QR code
 */
export async function transactionToUR(
  transaction: Transaction,
  xfp: string,
  publicKey: string,
  options: SignatureOptions = { saltLength: 32 }
) {
  // set transaction public key
  transaction.owner = publicKey;

  // create buffer object from transaction
  const txBuff = Buffer.from(JSON.stringify(transaction.toJSON()), "utf-8");

  // request ID
  const requestID = uuid();

  // construct request
  const signRequest = ArweaveSignRequest.constructArweaveRequest(
    txBuff,
    xfp,
    SignType.Transaction,
    options.saltLength,
    requestID
  );

  return signRequest.toUR();
}

export async function messageToUR(
  message: Uint8Array,
  xfp: string,
  options: SignatureOptions = { saltLength: 32 }
) {
  const messageBuff = Buffer.from(message);

  // request ID
  const requestID = uuid();

  // construct request
  const signRequest = ArweaveSignRequest.constructArweaveRequest(
    messageBuff,
    xfp,
    SignType.Message,
    options.saltLength,
    requestID
  );

  return signRequest.toUR();
}

export async function dataItemToUR(
  data: Uint8Array,
  xfp: string,
  options: SignatureOptions = { saltLength: 32 }
) {
  const messageBuff = Buffer.from(data);

  // construct request
  const signRequest = ArweaveSignRequest.constructArweaveRequest(
    messageBuff,
    xfp,
    SignType.DataItem,
    options.saltLength
  );

  return signRequest.toUR();
}

/**
 * Decode cbor result from a keystone QR code
 * with an Arweave transaction
 *
 * @returns Signature
 */
export async function decodeSignature(res: UR) {
  // check UR type
  if (res.type !== "arweave-signature") {
    throw new Error(
      `Invalid UR result. Expected "arweave-signature", received "${res.type}".`
    );
  }

  // decode cbor result
  const signatureData = ArweaveSignature.fromCBOR(res.cbor);
  const rawSignature = signatureData.getSignature();

  const signature = Arweave.utils.bufferTob64Url(rawSignature);

  // hash ID
  const id = Arweave.utils.bufferTob64Url(
    await Arweave.crypto.hash(rawSignature)
  );

  return {
    id,
    signature
  };
}

/**
 * Keystone account object interface
 */
export interface KeystoneAccount {
  address: string;
  owner: string;
  xfp: string;
}
