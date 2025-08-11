import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { useState, useRef, useCallback } from "react";
import SliderMenu from "~components/SliderMenu";
import { Button, Text, useToasts } from "@arconnect/components-rebrand";
import { AlertTriangle } from "@untitled-ui/icons-react";
import styled from "styled-components";
import { MinusIcon, PlusIcon } from "@iconicicons/react";
import { useInterval, useThrottledCallback, useTimeout } from "@swyg/corre";

interface SlippageSelectorModalProps {
  open: boolean;
  onClose: () => void;
  slippage: number;
  onSelect: (slippage: number) => void;
  type?: "sell" | "swap";
}

export function SlippageSelectorModal({
  open,
  onClose,
  slippage,
  onSelect,
  type = "sell",
}: SlippageSelectorModalProps) {
  const toasts = useToasts();
  const [selectedSlippage, setSelectedSlippage] = useState(slippage);
  const [isHolding, setIsHolding] = useState(false);
  const [holdDirection, setHoldDirection] = useState<"increase" | "decrease" | null>(null);
  const [holdStep, setHoldStep] = useState(0.1);
  const [shouldStartHolding, setShouldStartHolding] = useState(false);
  const isToastShowing = useRef(false);

  const throttledSlippageChange = useThrottledCallback(
    (amount: number, isIncrease: boolean) => {
      const newValue = Number((selectedSlippage + (isIncrease ? amount : -amount)).toFixed(1));
      const isAtLimit = isIncrease ? selectedSlippage >= 10 : selectedSlippage <= 0.5;

      if (isAtLimit && amount > 0) {
        if (!isToastShowing.current) {
          showToast(toasts, !isIncrease);
          isToastShowing.current = true;
          setTimeout(() => {
            isToastShowing.current = false;
          }, 3000);
        }
        return;
      }

      setSelectedSlippage(isIncrease ? Math.min(newValue, 10) : Math.max(newValue, 0.5));
    },
    100,
    [selectedSlippage, toasts],
  );

  useTimeout(
    () => {
      setIsHolding(true);
      setHoldStep(0.1);
    },
    shouldStartHolding ? 300 : null,
    [shouldStartHolding],
  );

  useInterval(
    () => {
      if (holdDirection) {
        setHoldStep((prev) => Math.min(prev * 1.1, 0.5));
        throttledSlippageChange(holdStep, holdDirection === "increase");
      }
    },
    isHolding && holdDirection ? 100 : null,
  );

  const handleInteractionStart = useCallback(
    (direction: "increase" | "decrease") => {
      // Immediate single step on press
      throttledSlippageChange(0.1, direction === "increase");

      // Set direction and trigger timeout
      setHoldDirection(direction);
      setShouldStartHolding(true);
    },
    [throttledSlippageChange],
  );

  const stopHold = useCallback(() => {
    // Stop the timeout and holding
    setShouldStartHolding(false);
    setIsHolding(false);
    setHoldDirection(null);
    setHoldStep(0.1);
  }, []);

  const handleMouseDown = useCallback(
    (direction: "increase" | "decrease") => (e: React.MouseEvent) => {
      e.preventDefault();
      handleInteractionStart(direction);
    },
    [handleInteractionStart],
  );

  const handleTouchStart = useCallback(
    (direction: "increase" | "decrease") => (e: React.TouchEvent) => {
      e.preventDefault();
      handleInteractionStart(direction);
    },
    [handleInteractionStart],
  );

  const handleConfirm = () => {
    onSelect(selectedSlippage);
    onClose();
  };

  return (
    <SliderMenu title={browser.i18n.getMessage("slippage")} isOpen={open} onClose={onClose}>
      <Flex direction="column" gap={24} height="100%" width="100%">
        <Text variant="secondary" size="sm" weight="medium" noMargin>
          {browser.i18n.getMessage(`${type}_slippage_description`)}
        </Text>
        <Flex direction="row" gap={16} align="center" justify="center" padding="20px 0" width="100%">
          <RoundedButton
            onMouseDown={handleMouseDown("decrease")}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={handleTouchStart("decrease")}
            onTouchEnd={stopHold}
            onTouchCancel={stopHold}>
            <MinusIcon />
          </RoundedButton>
          <ValueText size="5xl" weight="semibold" noMargin>
            {selectedSlippage}%
          </ValueText>
          <RoundedButton
            onMouseDown={handleMouseDown("increase")}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={handleTouchStart("increase")}
            onTouchEnd={stopHold}
            onTouchCancel={stopHold}>
            <PlusIcon />
          </RoundedButton>
        </Flex>
        <Button onClick={handleConfirm} fullWidth>
          {browser.i18n.getMessage("save")}
        </Button>
      </Flex>
    </SliderMenu>
  );
}

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
  flex-shrink: 0;
  flex-grow: 0;
  min-width: 40px;
  min-height: 40px;
  padding: 0;

  svg {
    height: 24px;
    width: 24px;

    path {
      stroke-width: 4;
    }
  }
`;

const ValueText = styled(Text)({
  width: "140px",
  textAlign: "center",
});
