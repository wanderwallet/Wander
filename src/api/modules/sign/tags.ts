import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { version } from "../../../../package.json";

export interface DecodedTag {
  name: string;
  value: string;
}

export const signedTxTags = [
  {
    name: "Signing-Client",
    value: IS_EMBEDDED_APP ? "Wander Connect" : "Wander",
  },
  {
    name: "Signing-Client-Version",
    value: version,
  },
];
