import { useEffect } from "react";
import { useLocation } from "@wanderapp/core";

export function BodyScroller() {
  const { location } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
