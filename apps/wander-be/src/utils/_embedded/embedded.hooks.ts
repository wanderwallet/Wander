import { useContext } from "react";
import { EmbeddedContext } from "~utils/_embedded/embedded.context";

export function useEmbedded() {
  return useContext(EmbeddedContext);
}
