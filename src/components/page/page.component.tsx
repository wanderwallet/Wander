import { type Variants, motion } from "framer-motion";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import styled from "styled-components";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import {
  locationToRouteType,
  routeTypeToPreferredLayout
} from "~utils/embedded/utils/routes/embedded-routes.utils";
import type { WanderRoutePath } from "~wallets/router/router.types";

export interface PageProps extends PropsWithChildren {}

export function Page({ children }: PageProps) {
  const mainRef = useRef<HTMLDivElement>(null);

  const opacityAnimation: Variants = {
    initial: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0, y: 0, transition: { duration: 0.2 } }
  };

  const [height, setHeight] = useState(0);

  useEffect(() => {
    const mainElement = mainRef.current;

    if (!mainElement || import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") return;

    const resizeObserver = new ResizeObserver((entries) => {
      const size = entries?.[0]?.contentBoxSize?.[0] || {
        inlineSize: 0,
        blockSize: 0
      };
      const width = Math.ceil(size.inlineSize);
      const height = Math.ceil(size.blockSize);

      if (width > 0 && height > 0) {
        // We get the path manually to avoid causing duplicate re-renders of the `Page` component if using the
        // `useLocation` hook:
        const path = location.hash.replace("#", "") as WanderRoutePath;
        const routeType = locationToRouteType(path);
        const preferredLayoutType = routeTypeToPreferredLayout(routeType);

        postEmbeddedMessage({
          type: "embedded_resize",
          data: {
            routeType,
            preferredLayoutType,
            width,
            height
          }
        });

        // For debugging only:;
        setHeight(height);
      }
    });

    resizeObserver.observe(mainElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Main
      ref={mainRef}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={opacityAnimation}
      data-test-id="Page"
    >
      {process.env.NODE_ENV === "development" &&
      import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? (
        <DivLine
          style={{ top: `${height - 6}px` }}
          data-height={`${height}px`}
        />
      ) : null}

      {children}
    </Main>
  );
}

const Main = styled(motion.main)`
  position: relative;
  top: 0;
  width: 100%;
  min-height: ${import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
    ? "none"
    : "100vh"};
  max-height: ${import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
    ? "none"
    : "max-content"};
`;

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
    font: bold 11px monospace;
    border-radius: 4px 4px 0 0;
  }
`;
