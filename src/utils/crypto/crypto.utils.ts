import type { JWKInterface } from "arweave/web/lib/wallet";

export function pemToBase64(pem: string) {
  // Only works for PKCS#8. In PKCS#1, the header says `-----BEGIN RSA PUBLIC KEY-----` instead.
  return pem
    .replace(/^-+(BEGIN|END) (PRIVATE|PUBLIC) KEY-+$/gm, "")
    .replace(/\s+/g, "");
}

export async function pemToJWK(pem: string): Promise<JWKInterface> {
  const binaryDer = Buffer.from(pemToBase64(pem), "base64");

  const importedKey = await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-PSS",
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
