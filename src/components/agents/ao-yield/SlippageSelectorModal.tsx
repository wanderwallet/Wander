import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { useState } from "react";
import SliderMenu from "~components/SliderMenu";
import { Button, Text } from "@arconnect/components-rebrand";

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
  const [selectedSlippage, setSelectedSlippage] = useState(slippage);

  function handleDecreaseSlippage() {
    const newValue = Number((selectedSlippage - 0.1).toFixed(1));
    setSelectedSlippage(Math.max(newValue, 0.5));
  }

  function handleIncreaseSlippage() {
    const newValue = Number((selectedSlippage + 0.1).toFixed(1));
    setSelectedSlippage(Math.min(newValue, 10));
  }

  return (
    <Flex direction="column" gap={24} height="100%" width="100%">
      <Text variant="secondary" size="sm" weight="medium" noMargin>
        {browser.i18n.getMessage("slippage_description")}
      </Text>
      <Flex direction="row" gap={16} align="center" justify="center" padding="20px 0">
        <Button variant="secondary" fullWidth onClick={handleDecreaseSlippage}>
          -
        </Button>
        <Text size="5xl" weight="semibold" noMargin>
          {selectedSlippage}%
        </Text>
        <Button variant="secondary" fullWidth onClick={handleIncreaseSlippage}>
          +
        </Button>
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
