import { ChevronDown } from "@untitled-ui/icons-react";
import { Flex } from "~components/common/Flex";
import { InputButton } from "~components/common/InputButton";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import { SlippageSelectorModal } from "~routes/popup/agents/components/ao-yield/SlippageSelectorModal";
import { useState } from "react";

export interface SlippageInputButtonProps {
  slippage: number;
  setSlippage: React.Dispatch<React.SetStateAction<number>>;
  type?: "sell" | "swap";
}

export function SlippageInputButton({ slippage, setSlippage, type = "sell" }: SlippageInputButtonProps) {
  const theme = useTheme();
  const [showSlippageSelector, setShowSlippageSelector] = useState(false);

  const openSlippageSelector = () => {
    setShowSlippageSelector(true);
  };

  const closeSlippageSelector = () => {
    setShowSlippageSelector(false);
  };

  return (
    <>
      <InputButton
        style={{ background: theme.surfaceTertiary }}
        onClick={openSlippageSelector}
        disabled={false}
        innerStyle={{ width: "100%" }}
        body={
          <Flex direction="row" gap={8} align="center" justify="space-between">
            <Text size="lg" weight="medium" noMargin>
              {browser.i18n.getMessage("slippage")}
            </Text>
            <Flex align="center" justify="center" gap={4}>
              {slippage === 0.5 && <Tag>{browser.i18n.getMessage("auto")}</Tag>}
              <Text weight="medium" noMargin>
                {slippage}%
              </Text>
            </Flex>
          </Flex>
        }
        icon={
          <Flex align="center" justify="center">
            <ChevronDown onClick={openSlippageSelector} />
          </Flex>
        }
        outerLabel
      />
      <SlippageSelectorModal
        open={showSlippageSelector}
        onClose={closeSlippageSelector}
        slippage={slippage}
        onSelect={setSlippage}
        type={type}
        minSlippage={0.5}
        maxSlippage={type === "sell" ? 10 : 25}
      />
    </>
  );
}

const Tag = styled.div`
  padding: 4px 8px;
  border-radius: 50px;
  background-color: ${({ theme }) => (theme.displayTheme === "dark" ? "#2b2269" : "#E3D8F6")};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.secondaryText};
`;
