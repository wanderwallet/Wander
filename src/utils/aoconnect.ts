import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { ArweaveSigner, createData } from "@dha-team/arbundles";
import { generateAnchor, KeystoneSigner } from "~wallets/hardware/keystone";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { getActiveAddress } from "~wallets";

const ARDRIVE_CU_URL = "https://cu.ardrive.io";
export const DATAITEM_SIGNER_KIND = "ans104";
export const HTTP_SIGNER_KIND = "httpsig";

export const arweave = Arweave.init(defaultGateway);
export const aoInstance = connect(defaultConfig);
export const ardriveAoInstance = connect({ MODE: "legacy", CU_URL: ARDRIVE_CU_URL });

function createANS104Signer(wallet) {
  const signer = async (create) => {
    /**
     * set passthrough in order to receive the arguements as they were passed
     * to toDataItemSigner
     */
    const { data, tags, target, anchor } = await create({
      alg: "rsa-v1_5-sha256",
      passthrough: true,
    });

    if (wallet instanceof KeystoneSigner) {
      const signer = wallet;
      let _anchor = anchor || generateAnchor();
      const dataItem = createData(data, signer, { tags, target, anchor: _anchor });
      const serial = dataItem.getRaw();
      const signature = await signer.sign(serial);
      dataItem.setSignature(Buffer.from(signature));

      return {
        id: dataItem.id,
        raw: dataItem.getRaw(),
      };
    } else {
      const signer = wallet instanceof ArweaveSigner ? wallet : new ArweaveSigner(wallet);
      const dataItem = createData(data, signer, { tags, target, anchor });
      await dataItem.sign(signer);

      return {
        id: dataItem.id,
        raw: dataItem.getRaw(),
      };
    }
  };

  return signer;
}

function createHttpSigner(wallet) {
  const signer = async (create) => {
    if (wallet instanceof KeystoneSigner) {
      // Note: wallet is a keystone signer and create KeystoneSigner instance with SignType.Message
      const publicKey = wallet.publicKey;
      const address = await getActiveAddress();

      const signatureBase = await create({
        type: 1,
        publicKey,
        address,
        alg: "rsa-pss-sha512",
      });

      const signature = await wallet.sign(signatureBase);
      return { signature: Buffer.from(signature), address };
    } else {
      const publicKey = wallet.n;
      const address = await arweave.wallets.getAddress(wallet);

      const signatureBase = await create({
        type: 1,
        publicKey,
        address,
        alg: "rsa-pss-sha512",
      });

      const hash = await crypto.subtle.digest("SHA-512", signatureBase);

      const cryptoKey = await crypto.subtle.importKey(
        "jwk",
        wallet,
        {
          name: "RSA-PSS",
          hash: "SHA-512",
        },
        false,
        ["sign"],
      );

      const signature = await crypto.subtle.sign({ name: "RSA-PSS", saltLength: 32 }, cryptoKey, hash);

      return { signature: Buffer.from(signature), address };
    }
  };

  return signer;
}

/**
 * A function that builds a signer using a wallet jwk interface
 * commonly used in web-based dApps
 *
 * This is provided as a convenience for consumers of the SDK
 * to use, but consumers can also implement their own signer
 *
 */
export function createSigner(wallet) {
  const dataItemSigner = createANS104Signer(wallet);
  const httpSigner = createHttpSigner(wallet);

  const signer = <K extends typeof DATAITEM_SIGNER_KIND | typeof HTTP_SIGNER_KIND>(
    create: any,
    kind: K,
  ): Promise<
    K extends typeof DATAITEM_SIGNER_KIND
      ? { id: string; raw: Buffer<ArrayBufferLike> }
      : { signature: Buffer<ArrayBufferLike>; address: string }
  > => {
    if (kind === DATAITEM_SIGNER_KIND) return dataItemSigner(create) as any;
    if (kind === HTTP_SIGNER_KIND) return httpSigner(create) as any;
    throw new Error(`signer kind unknown "${kind}"`);
  };

  return signer;
}

export const createDataItemSigner = createSigner;
