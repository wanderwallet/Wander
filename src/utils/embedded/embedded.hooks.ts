import { useContext } from "react";
import { EmbeddedContext } from "~utils/embedded/embedded.provider";

export function useEmbedded() {
  return useContext(EmbeddedContext);
}
