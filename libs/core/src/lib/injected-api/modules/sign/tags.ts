import { version } from "../../../../../wander-wallet-api/package.json";

export interface DecodedTag {
  name: string;
  value: string;
}

export const signedTxTags = [
  {
    name: "Signing-Client",
    value: import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "Wander Connect" : "Wander",
  },
  {
    name: "Signing-Client-Version",
    value: version,
  },
];
