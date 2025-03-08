import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Spacer, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";

const PasswordMatch = ({ matches }: Props) => (
  <AnimatePresence>
    {matches && (
      <motion.div
        initial="hidden"
        animate="shown"
        exit="hidden"
        variants={opacityAnimation}
      >
        <Spacer y={0.5} />
        <MatchIndicator>
          {browser.i18n.getMessage("passwords_match")}
        </MatchIndicator>
      </motion.div>
    )}
  </AnimatePresence>
);

const MatchIndicator = styled(Text).attrs({
  noMargin: true,
  size: "sm"
})`
  color: #56c980;
`;

const opacityAnimation: Variants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  shown: {
    opacity: 1,
    height: "auto"
  }
};

interface Props {
  matches: boolean;
}

export default PasswordMatch;
