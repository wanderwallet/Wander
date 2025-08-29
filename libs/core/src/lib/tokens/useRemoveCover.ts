import { useEffect } from "react";

export function useRemoveCover() {
  useEffect(() => {
    const coverElement = document.getElementById("cover");

    if (coverElement) {
      coverElement.setAttribute("aria-hidden", "true");
    }
  }, []);
}
