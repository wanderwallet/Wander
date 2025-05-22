import { type Variants, motion } from "framer-motion";
import { useRef, type PropsWithChildren } from "react";
import styled from "styled-components";
import { ResizeEventObserver } from "~components/ResizeEventObserver";
import StoragePartitionedBanner from "~components/StoragePartitionedBanner";

export interface PageProps extends PropsWithChildren {

}

export function Page({ children }: PageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const opacityAnimation: Variants = {
    initial: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <Main
      ref={containerRef}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={opacityAnimation}
      data-test-id="Page">
      <ResizeEventObserver containerRef={containerRef} />
      {children}
      <StoragePartitionedBanner />
    </Main>
  );
}

const Main = styled(motion.main)`
  position: relative;
  top: 0;
  width: 100%;
  display: ${import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "flex" : "block"};
  flex-direction: column;
  min-height: ${import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "400px" : "100vh"};
  max-height: ${import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "none" : "max-content"};
`;
