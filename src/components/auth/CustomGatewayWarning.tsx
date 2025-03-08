import { WarningTriangleIcon } from "@iconicicons/react";
import { motion, type Variants } from "framer-motion";
import { Section } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function CustomGatewayWarning({ simple = false }: Props) {
  return (
    <motion.div
      variants={animation}
      initial="hidden"
      animate="shown"
      exit="hidden"
    >
      <Section showPaddingVertical={false}>
        <Alert>
          <Icon />
          {browser.i18n.getMessage(
            simple ? "custom_gateway_warning_simple" : "custom_gateway_warning"
          )}
        </Alert>
      </Section>
    </motion.div>
  );
}

export const Alert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: rgb(255, 184, 0);
  font-weight: 500;
  font-size: 1rem;
  background-color: rgba(255, 184, 0, 0.2);
  padding: 0.9rem 1rem;
  border-radius: 19px;
`;

export const Icon = styled(WarningTriangleIcon)`
  width: 40px;
  height: 40px;
`;

const animation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

interface Props {
  simple?: boolean;
}
