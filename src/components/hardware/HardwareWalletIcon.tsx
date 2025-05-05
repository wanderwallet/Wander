import { motion, type Variants } from "framer-motion";
import styled from "styled-components";

const HardwareWalletIcon = styled(motion.div)<Props>`
  width: 20px;
  height: 20px;
  background-color: ${(props) => props.color};
  background-image: url(${(props) => props.icon});
  background-size: 74%;
  background-position: center center;
  background-repeat: no-repeat;
  border-radius: 100%;
`;

const hwIconAnimation: Variants = {
  hidden: {
    scale: 0,
    transition: {
      type: "spring",
      duration: 0.4,
    },
  },
  shown: {
    scale: 1,
    transition: {
      type: "spring",
      duration: 0.4,
      delayChildren: 0.2,
      staggerChildren: 0.05,
    },
  },
};

export const hwIconAnimateProps = {
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  variants: hwIconAnimation,
};

interface Props {
  icon: string;
  color: string;
}

export default HardwareWalletIcon;
