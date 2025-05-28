import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { useState } from "react";
import SliderMenu from "~components/SliderMenu";
import { Button, Text, useToasts } from "@arconnect/components-rebrand";
import { AlertTriangle } from "@untitled-ui/icons-react";
import styled from "styled-components";

export interface Asset {
  ticker: string;
  logo: string;
}

interface SlippageSelectorModalProps {
  open: boolean;
  onClose: () => void;
  slippage: number;
  onSelect: (slippage: number) => void;
}

export function SlippageSelectorModal({ open, onClose, slippage, onSelect }: SlippageSelectorModalProps) {
  const [currentSlippage, setCurrentSlippage] = useState(slippage);

  return (
    <SliderMenu title={browser.i18n.getMessage("slippage")} isOpen={open} onClose={onClose}>
      <SlippageSelectorScreen
        onClose={onClose}
        slippage={currentSlippage}
        updateSlippage={(slippage) => {
          setCurrentSlippage(slippage);
          onSelect(slippage);
        }}
      />
    </SliderMenu>
  );
}

const SlippageSelectorScreen = ({
  onClose,
  slippage,
  updateSlippage,
}: {
  onClose: () => void;
  slippage: number;
  updateSlippage: (slippage: number) => void;
}) => {
  const toasts = useToasts();
  const [selectedSlippage, setSelectedSlippage] = useState(slippage);

  function handleDecreaseSlippage() {
    const newValue = Number((selectedSlippage - 0.1).toFixed(1));
    if (newValue < 0.5) {
      showToast(toasts, true);
      return;
    }
    setSelectedSlippage(Math.max(newValue, 0.5));
  }

  function handleIncreaseSlippage() {
    const newValue = Number((selectedSlippage + 0.1).toFixed(1));
    if (newValue > 10) {
      showToast(toasts, false);
      return;
    }
    setSelectedSlippage(Math.min(newValue, 10));
  }

  return (
    <Flex direction="column" gap={24} height="100%" width="100%">
      <Text variant="secondary" size="sm" weight="medium" noMargin>
        {browser.i18n.getMessage("slippage_description")}
      </Text>
      <Flex direction="row" gap={16} align="center" justify="center" padding="20px 0" width="100%">
        <RoundedButton onClick={handleDecreaseSlippage}>-</RoundedButton>
        <Text size="5xl" weight="semibold" noMargin>
          {selectedSlippage}%
        </Text>
        <RoundedButton onClick={handleIncreaseSlippage}>+</RoundedButton>
      </Flex>
      <Button
        onClick={() => {
          updateSlippage(selectedSlippage);
          onClose();
        }}
        fullWidth>
        {browser.i18n.getMessage("save")}
      </Button>
    </Flex>
  );
};

function showToast(toasts: ReturnType<typeof useToasts>, isMinSlippage: boolean) {
  toasts.setToast({
    content: isMinSlippage
      ? browser.i18n.getMessage("slippage_cannot_be_less_than_0_5")
      : browser.i18n.getMessage("slippage_cannot_be_greater_than_10"),
    type: "info",
    duration: 3000,
    showProgress: true,
    position: "top",
    showCloseButton: false,
    icon: <AlertTriangle style={{ color: "#EEBD41" }} height={20} width={20} />,
  });
}

const RoundedButton = styled(Button).attrs({
  variant: "secondary",
  height: "40px",
  width: "40px",
})`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 32px;
  flex-shrink: 0;
  flex-grow: 0;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
`;
