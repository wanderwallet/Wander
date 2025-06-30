import React, { useCallback, useEffect, useRef } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { locationToRouteType, routeTypeToPreferredLayout } from "~utils/embedded/utils/routes/embedded-routes.utils";

import styles from "./ResizeEventObserver.module.scss";

export interface ResizeEventObserverProps {
  containerRef: React.MutableRefObject<HTMLElement>;
}

export function ResizeEventObserver({ containerRef }: ResizeEventObserverProps) {
  const { location } = useLocation();

  const lineRef = useRef<HTMLDivElement>();
  const locationRef = useRef(location);
  const sizeRef = useRef({ width: 0, height: 0 });

  const dispatchResizeEvent = useCallback(() => {
    const containerElement = containerRef.current;

    if (!containerElement || import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") return;

    const location = locationRef.current;

    if (location.startsWith("/__OVERRIDES/")) return;

    const { height } = sizeRef.current;

    if (height <= 0) return;

    const routeType = locationToRouteType(location);
    const preferredLayoutType = routeTypeToPreferredLayout(routeType);

    postEmbeddedMessage({
      type: "embedded_resize",
      data: {
        routeType,
        preferredLayoutType,
        height,
      },
    });

    const lineElement = lineRef.current;

    if (lineElement) {
      lineElement.style.setProperty("--height", `${height - 2}px`);
      lineElement.dataset.height = `${height}px`;
    }
  }, []);

  useEffect(() => {
    locationRef.current = location;
    dispatchResizeEvent();
  }, [dispatchResizeEvent, location]);

  useEffect(() => {
    const containerElement = containerRef.current;

    if (!containerElement || import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") return;

    const resizeObserver = new ResizeObserver((entries) => {
      const size = entries?.[0]?.contentBoxSize?.[0] || {
        inlineSize: 0,
        blockSize: 0,
      };

      const width = Math.ceil(size.inlineSize);
      const height = Math.ceil(size.blockSize);

      sizeRef.current = { width, height };

      dispatchResizeEvent();
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [dispatchResizeEvent]);

  if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1" || process.env.NODE_ENV !== "development") return null;

  return <div className={styles.line} ref={lineRef} />;
}
