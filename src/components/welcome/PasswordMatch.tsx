import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Spacer, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

const PasswordMatch = ({ matches }: Props) => (
  <AnimatePresence>
    {matches && (
      <motion.div initial="hidden" animate="shown" exit="hidden" variants={opacityAnimation}>
        <Spacer y={0.5} />
        <MatchIndicator>{browser.i18n.getMessage("passwords_match")}</MatchIndicator>
      </motion.div>
    )}
  </AnimatePresence>
);

const MatchIndicator = styled(Text).attrs({
  noMargin: true,
  size: "sm",
})`
  color: ${IS_EMBEDDED_APP ? "#007229" : "#56c980"};
`;

const opacityAnimation: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  shown: {
    opacity: 1,
    height: "auto",
  },
};

interface Props {
  matches: boolean;
}

export default PasswordMatch;
