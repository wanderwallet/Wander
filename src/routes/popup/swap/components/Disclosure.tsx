import { Text } from "@arconnect/components-rebrand";
import { HorizontalLine } from "~components/HorizontalLine";
import { Flex } from "../../../../components/common/Flex";
import { ChevronDown, ChevronUp } from "@untitled-ui/icons-react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import browser from "webextension-polyfill";

export interface DisclosureButtonProps {
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  expandedMessageName?: string;
  collapsedMessageName?: string;
  textVariant?: "primary" | "secondary" | "tertiary";
}

export function DisclosureButton({
  showAdvanced,
  setShowAdvanced,
  expandedMessageName,
  collapsedMessageName,
  textVariant = "secondary",
}: DisclosureButtonProps) {
  expandedMessageName = expandedMessageName || "less_settings";
  collapsedMessageName = collapsedMessageName || "more_settings";

  return (
    <Wrapper onClick={() => setShowAdvanced((prev) => !prev)}>
      <HorizontalLine style={{ flexShrink: 1 }} />
      <Flex gap={4} align="center" justify="center">
        <Text style={{ whiteSpace: "nowrap" }} variant={textVariant} size="xs" weight="medium" noMargin>
          {browser.i18n.getMessage(showAdvanced ? expandedMessageName : collapsedMessageName)}
        </Text>
        <Action as={showAdvanced ? ChevronUp : ChevronDown} />
      </Flex>
      <HorizontalLine style={{ flexShrink: 1 }} />
    </Wrapper>
  );
}

export interface DisclosureContentProps {
  expanded: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function DisclosureContent({ expanded, children, style }: DisclosureContentProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: expanded ? "auto" : 0,
        opacity: expanded ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
        opacity: { duration: 0.2, delay: expanded ? 0.1 : 0 },
      }}
      style={{ overflow: "visible" }}
      onClick={(e) => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        {expanded && (
          <motion.div
            key="expandable-content"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}>
            <ExpandableWrapper style={style}>{children}</ExpandableWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const ExpandableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 0;
  cursor: pointer;

  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
  }
`;

const Action = styled(ChevronDown)`
  cursor: pointer;
  font-size: 1.25rem;
  width: 1rem;
  height: 1rem;
  color: ${(props) => props.theme.tertiaryText};
`;
