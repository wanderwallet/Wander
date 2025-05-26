import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { useState } from "react";
import SliderMenu from "~components/SliderMenu";

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
    <SliderMenu title={browser.i18n.getMessage("slippage")} paddingVertical={180} isOpen={open} onClose={onClose}>
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
  return <Flex direction="column" gap={8}></Flex>;
};
