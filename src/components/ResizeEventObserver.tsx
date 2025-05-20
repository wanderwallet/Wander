import { type Variants, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { locationToRouteType, routeTypeToPreferredLayout } from "~utils/embedded/utils/routes/embedded-routes.utils";
import type { WanderRoutePath } from "~wallets/router/router.types";

export interface ResizeEventObserver {
  containerRef: React.MutableRefObject<HTMLElement>;
}

export function ResizeEventObserver({
  containerRef,
}: ResizeEventObserver) {
  const { location } = useLocation();
  const [height, setHeight] = useState(0);

  const locationRef = useRef(location);
  const sizeRef = useRef({ width: 0, height: 0 });

  const dispatchResizeEvent = useCallback(() => {
    const containerElement = containerRef.current;

    if (!containerElement || import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") return;

    const { width, height } = sizeRef.current;

    if (width <= 0 || height <= 0) return;

    const routeType = locationToRouteType(location);
    const preferredLayoutType = routeTypeToPreferredLayout(routeType);

    postEmbeddedMessage({
      type: "embedded_resize",
      data: {
        routeType,
        preferredLayoutType,
        width,
        height,
      },
    });

    // For debugging only:
    setHeight(height);
  }, []);

  useEffect(() => {
    locationRef.current = location;
    dispatchResizeEvent();
  }, [dispatchResizeEvent, location])

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

  return <DivLine style={{ top: `${height - 6}px` }} data-height={`${height}px`} />;
}


const DivLine = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  border-bottom: 2px dashed red;
  z-index: 9999;
  pointer-events: none;

  &::before {
    content: attr(data-height);
    position: absolute;
    top: 2px;
    left: 16px;
    transform: translate(0, -100%);
    padding: 4px 8px;
    background: red;
    color: white;
    font: bold 11px monospace;
    border-radius: 4px 4px 0 0;
  }
`;
