import { motion, type Variants } from "framer-motion";
import { Loading } from "@arconnect/components";
import type { HTMLProps } from "react";
import styled from "styled-components";

const TokenLoading = (props: HTMLProps<HTMLDivElement>) => (
  <LoadingWrapper variants={opacityAnimation} initial="hidden" animate="shown" exit="hidden" {...(props as any)}>
    <Spinner />
  </LoadingWrapper>
);

const Spinner = styled(Loading)`
  font-size: 1.2rem;
  color: rgb(${(props) => props.theme.theme});
`;

const LoadingWrapper = styled(motion.div)`
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 100;
`;

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

export default TokenLoading;
