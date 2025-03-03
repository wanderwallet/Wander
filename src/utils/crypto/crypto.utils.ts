import type { JWKInterface } from "arweave/web/lib/wallet";

export function pemToBase64(pem: string) {
  // PKCS#1 header => `-----BEGIN RSA PUBLIC KEY-----`
  // PKCS#8 header => `-----BEGIN PUBLIC KEY-----`
  return pem
    .replace(/^-+(BEGIN|END) (RSA )?(PRIVATE|PUBLIC) KEY-+$/gm, "")
    .replace(/\s+/g, "");
}

export async function pemToJWK(pem: string): Promise<JWKInterface> {
  // base64 decode the string to get the binary data
  const binaryDerString = window.atob(pemToBase64(pem));

  // convert from a binary string to an ArrayBuffer
  const binaryDer = str2ab(binaryDerString);

  const importedKey = await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    true,
    ["sign"]
  );

  return window.crypto.subtle.exportKey(
    "jwk",
    importedKey as any
  ) as Promise<JWKInterface>;
}

export async function privateKeyDerToJWK(der: string): Promise<JWKInterface> {
  const binaryDer = str2ab(der);

  const importedKey = await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    true,
    ["sign"]
  );

  return window.crypto.subtle.exportKey(
    "jwk",
    importedKey
  ) as Promise<JWKInterface>;
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
