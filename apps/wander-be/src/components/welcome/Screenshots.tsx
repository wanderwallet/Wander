import type { HTMLProps } from "react";
import { motion } from "framer-motion";
import collectibleScreenshot from "url:/assets/screenshots/collectible.png";
import exploreScreenshot from "url:/assets/screenshots/explore.png";
import homeScreenshot from "url:/assets/screenshots/home.png";
import styled from "styled-components";

export default function Screenshots(props: HTMLProps<HTMLDivElement>) {
  return (
    <Wrapper {...(props as any)}>
      <Column>
        <Screenshot src={exploreScreenshot} />
        <Screenshot src={homeScreenshot} />
        <Screenshot src={collectibleScreenshot} />
      </Column>
      <Column fromTop>
        <Screenshot src={exploreScreenshot} />
        <Screenshot src={collectibleScreenshot} />
        <Screenshot src={homeScreenshot} />
      </Column>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: absolute;
  overflow: hidden;
  top: 0;
  left: 40%;
  right: 10%;
  bottom: 0;
  display: flex;
  gap: 10%;
  z-index: -10;
`;

const Column = styled(motion.div).attrs<{ fromTop?: boolean }>((props) => ({
  initial: {
    translateY: props.fromTop ? "-150%" : "30%",
    opacity: 0.4,
  },
  animate: {
    translateY: props.fromTop ? "-50%" : "-70%",
    opacity: 1,
  },
  transition: {
    duration: 1,
  },
}))<{ fromTop?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2.7rem;
`;

const Screenshot = styled.img.attrs({
  draggable: false,
})`
  width: 100%;
  user-select: none;
`;
