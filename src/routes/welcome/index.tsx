import { Spacer } from "@arconnect/components";
import { Button } from "@arconnect/components-rebrand";
import { AnimatePresence, motion } from "framer-motion";
import styled from "styled-components";
import browser from "webextension-polyfill";
import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import WanderIcon from "url:assets/icon.svg";
import StarIcons from "~components/welcome/StarIcons";
import IconText from "~components/IconText";

export function HomeWelcomeView() {
  const { navigate } = useLocation();

  // button refs
  const startButton = useRef<HTMLButtonElement>();
  const walletButton = useRef<HTMLButtonElement>();

  // position of the expand animation element
  const [expandPos, setExpandPos] = useState<{ x: number; y: number }>();

  // expand animation functionality
  const animate = (btn: MutableRefObject<HTMLButtonElement>) =>
    new Promise<void>((res) => {
      // get pos
      const btnDimensions = btn.current.getBoundingClientRect();

      setExpandPos({
        x: btnDimensions.x + btnDimensions.width / 2,
        y: btnDimensions.y + btnDimensions.height / 2
      });

      // wait for the animation to complete
      setTimeout(res, expand_animation_duration + 750);
    });

  // window size
  const windowDimensions = useWindowDimensions();

  // circle size
  const circleSize = useMemo(
    () =>
      windowDimensions.height > windowDimensions.width
        ? windowDimensions.height
        : windowDimensions.width,
    [windowDimensions]
  );

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_START);
  }, []);

  return (
    <Wrapper>
      <StarIcons />
      <Panel>
        <WelcomeContent>
          <ImagesWrapper>
            <Image
              width="126.314px"
              height="59.199px"
              src={WanderIcon}
              alt="Wander Icon"
            />
            <IconText width={280} height={52.866} />
          </ImagesWrapper>
          <Spacer y={3.5} />
          <ButtonsWrapper>
            <WelcomeButton
              ref={startButton}
              onClick={async () => {
                await animate(startButton);
                navigate("/generate/1");
              }}
            >
              {browser.i18n.getMessage("create_a_new_account")}
            </WelcomeButton>
            <WelcomeButton
              variant="secondaryAlt"
              ref={walletButton}
              onClick={async () => {
                await animate(walletButton);
                navigate("/load/1");
              }}
            >
              {browser.i18n.getMessage("import_an_existing_account")}
            </WelcomeButton>
          </ButtonsWrapper>
        </WelcomeContent>
      </Panel>
      <AnimatePresence>
        {expandPos && (
          <ExpandAnimationElement pos={expandPos} circleSize={circleSize} />
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  width: 100vw;
  height: 100vh;
  background-color: ${(props) =>
    props.theme.displayTheme === "dark" ? "#1e1b4b" : "#f0e8ff"};
`;

const Panel = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background: transparent;
`;

const WelcomeContent = styled.div``;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const WelcomeButton = styled(Button)`
  padding-left: 0;
  padding-right: 0;
  width: calc(100% - 0.75rem * 1);
`;

// in ms
const expand_animation_duration = 0.75;

const ExpandAnimationElement = styled(motion.div).attrs<{
  pos: { x: number; y: number };
  circleSize: number;
}>((props) => ({
  variants: {
    closed: {
      opacity: 0.2,
      clipPath: `circle(20px at ${props.pos.x + "px"} ${props.pos.y + "px"})`,
      transition: {
        type: "easeInOut",
        duration: expand_animation_duration
      }
    },
    open: {
      opacity: 1,
      clipPath: `circle(${props.circleSize + "px"} at ${props.pos.x + "px"} ${
        props.pos.y + "px"
      })`,
      transition: {
        type: "easeInOut",
        duration: expand_animation_duration
      }
    }
  },
  initial: "closed",
  animate: "open",
  exit: "closed"
}))<{ pos: { x: number; y: number }; circleSize: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgb(${(props) => props.theme.background});
  z-index: 1000;
`;

const Image = styled.img``;

const ImagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 31.447px;
`;

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;

  return {
    width,
    height
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    const lisetener = () => setWindowDimensions(getWindowDimensions());

    window.addEventListener("resize", lisetener);

    return () => window.removeEventListener("resize", lisetener);
  }, []);

  return windowDimensions;
}
