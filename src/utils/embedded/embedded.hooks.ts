import { useContext } from "react";
import { EmbeddedContext } from "~utils/embedded/embedded.context";

export function useEmbedded() {
  return useContext(EmbeddedContext);
}
