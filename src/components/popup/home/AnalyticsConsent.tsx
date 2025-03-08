import { motion, AnimatePresence } from "framer-motion";
import { Button, Text } from "@arconnect/components";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { CloseIcon } from "@iconicicons/react";
import type { Variants } from "framer-motion";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function AnalyticsConsent() {
  // store user answer
  const [_, setAnalytics] = useSetting<boolean>("analytics");
  const [answered, setAnswered] = useStorage<boolean>({
    key: "analytics_consent_answered",
    instance: ExtensionStorage
  });

  return (
    <>
      <AnimatePresence>
        {!answered && (
          <ConsentDialog
            onClick={() => {
              setAnalytics(true);
              setAnswered(true);
            }}
            key="dialog"
          >
            <ConsentText>
              {browser.i18n.getMessage("analytics_description")}{" "}
              <a
                href="https://www.wander.app/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {browser.i18n.getMessage("explore_article_read_more")}
              </a>
            </ConsentText>
            <Buttons>
              <ConsentButton
                onClick={(e) => {
                  e.stopPropagation();
                  setAnalytics(false);
                  setAnswered(true);
                }}
              >
                {browser.i18n.getMessage("decline")}
              </ConsentButton>
              <CloseButton>
                <CloseIcon />
              </CloseButton>
            </Buttons>
          </ConsentDialog>
        )}
        {!answered && (
          <BackgroundLayer onClick={() => setAnalytics(true)} key="bg" />
        )}
      </AnimatePresence>
    </>
  );
}

const backgroundAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const dialogAnimation: Variants = {
  hidden: { opacity: 0, translateY: 10 },
  shown: { opacity: 1, translateY: 0 }
};

const ConsentDialog = styled(motion.div).attrs({
  variants: dialogAnimation,
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  transition: { duration: 0.17 }
})`
  position: fixed;
  display: flex;
  align-items: center;
  gap: 1.24rem;
  padding: 0.75rem 1rem;
  background-color: rgb(${(props) => props.theme.cardBackground});
  border-radius: 15px;
  bottom: 0.7rem;
  right: 0.7rem;
  left: 0.7rem;
  z-index: 201;
`;

const BackgroundLayer = styled(motion.div).attrs({
  variants: backgroundAnimation,
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  transition: { duration: 0.15 }
})`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 200;
`;

const ConsentText = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.88rem;

  a {
    color: rgb(${(props) => props.theme.theme});
    text-decoration: none;
  }
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ConsentButton = styled(Button).attrs({
  small: true,
  secondary: true
})`
  padding: 0.66rem 1.35rem;
  border-radius: 13px;
`;

const CloseButton = styled.button`
  position: relative;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 100%;
  outline: none;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(${(props) => props.theme.theme}, 0.15);
  }

  svg {
    position: absolute;
    width: 1.1rem;
    height: 1.1rem;
    top: 50%;
    left: 50%;
    color: rgb(${(props) => props.theme.theme});
    transform: translate(-50%, -50%);
  }
`;
