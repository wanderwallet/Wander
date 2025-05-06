import { AnimatePresence, motion, type Variants } from "framer-motion";
import styled, { css } from "styled-components";
import { CloseIcon } from "@iconicicons/react";
import { Loading, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import QrReader from "react-qr-reader";

export default function AddressScanner({ active, close, onScan }: Props) {
  return (
    <AnimatePresence>
      {active && (
        <Wrapper>
          <LoadingWrapper>
            <LoadingScanner />
          </LoadingWrapper>
          <Head>
            <Title>{browser.i18n.getMessage("transaction_send_scan_address")}</Title>
            <Close onClick={close} />
          </Head>
          <Scanner onScan={onScan} />
          <ViewFinder />
        </Wrapper>
      )}
    </AnimatePresence>
  );
}

const scannerAnimation: Variants = {
  shown: { top: 0 },
  hidden: { top: "110%" },
};

const Wrapper = styled(motion.div).attrs({
  variants: scannerAnimation,
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
})`
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 100000000;
  background-color: #000;
`;

const Head = styled.div`
  position: absolute;
  top: 1.5rem;
  left: 1rem;
  right: 1rem;
  z-index: 2;
`;

const Title = styled(Text).attrs({
  noMargin: true,
})`
  font-size: 1.2rem;
  text-align: center;
  color: #fff;
  font-weight: 500;
`;

const Close = styled(CloseIcon)`
  position: absolute;
  top: 50%;
  right: 0;
  font-size: 1.3rem;
  width: 1em;
  height: 1em;
  color: #fff;
  transform: translateY(-50%);
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.95) translateY(-50%);
  }
`;

const centerAbsolute = css`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const LoadingWrapper = styled.div`
  ${centerAbsolute}
`;

const LoadingScanner = styled(Loading)`
  width: 1.5rem;
  height: 1.5rem;
  color: rgb(${(props) => props.theme.theme});
`;

const Scanner = styled(QrReader).attrs({
  showViewFinder: false,
  onError: () => {},
})`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 1;

  section {
    height: 100%;
  }

  video {
    object-position: center;
  }
`;

const ViewFinder = styled.div`
  width: 80vw;
  height: 80vw;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  z-index: 2;
  ${centerAbsolute}
`;

interface Props {
  active: boolean;
  close: () => void;
  onScan: (data: string) => void;
}
