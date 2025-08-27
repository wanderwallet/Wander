import { useContext } from "react";
import { EmbeddedContext } from "./embedded.context";

export function useEmbedded() {
  return useContext(EmbeddedContext);
}
