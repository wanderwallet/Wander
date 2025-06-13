import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { useState, useRef, useCallback, useEffect } from "react";
import SliderMenu from "~components/SliderMenu";
import { Button, Text, useToasts } from "@arconnect/components-rebrand";
import { AlertTriangle } from "@untitled-ui/icons-react";
import styled from "styled-components";
import { MinusIcon, PlusIcon } from "@iconicicons/react";

interface SlippageSelectorModalProps {
  open: boolean;
  onClose: () => void;
  slippage: number;
  onSelect: (slippage: number) => void;
}

export function SlippageSelectorModal({ open, onClose, slippage, onSelect }: SlippageSelectorModalProps) {
  const toasts = useToasts();
  const [selectedSlippage, setSelectedSlippage] = useState(slippage);
  const [isHolding, setIsHolding] = useState(false);
  const [holdDirection, setHoldDirection] = useState<"increase" | "decrease" | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const isToastShowing = useRef(false);
  const lastUpdateTime = useRef<number>(0);
  const updateSpeed = useRef<number>(0.1);

  const handleSlippageChange = useCallback(
    (amount: number, isIncrease: boolean) => {
      const now = Date.now();
      if (now - lastUpdateTime.current < 32) return; // ~30fps

      lastUpdateTime.current = now;
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
    [selectedSlippage, toasts],
  );

  const handleDecreaseSlippage = useCallback(
    (amount: number = 0.1) => {
      handleSlippageChange(amount, false);
    },
    [handleSlippageChange],
  );

  const handleIncreaseSlippage = useCallback(
    (amount: number = 0.1) => {
      handleSlippageChange(amount, true);
    },
    [handleSlippageChange],
  );

  const updateHold = useCallback(() => {
    if (!isHolding || !holdDirection) return;

    updateSpeed.current = Math.min(updateSpeed.current + 0.1, 1.0);

    if (holdDirection === "increase") {
      handleIncreaseSlippage(updateSpeed.current);
    } else {
      handleDecreaseSlippage(updateSpeed.current);
    }

    animationFrameRef.current = requestAnimationFrame(updateHold);
  }, [isHolding, holdDirection, handleIncreaseSlippage, handleDecreaseSlippage]);

  useEffect(() => {
    if (isHolding && holdDirection) {
      updateSpeed.current = 0.1;
      animationFrameRef.current = requestAnimationFrame(updateHold);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isHolding, holdDirection, updateHold]);

  const handleInteractionStart = useCallback(
    (direction: "increase" | "decrease") => {
      if (direction === "increase") {
        handleIncreaseSlippage(0.1);
      } else {
        handleDecreaseSlippage(0.1);
      }

      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }

      holdTimeoutRef.current = setTimeout(() => {
        setIsHolding(true);
        setHoldDirection(direction);
      }, 150);
    },
    [handleIncreaseSlippage, handleDecreaseSlippage],
  );

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

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = undefined;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    setIsHolding(false);
    setHoldDirection(null);
    updateSpeed.current = 0.1;
  }, []);

  const handleConfirm = () => {
    onSelect(selectedSlippage);
    onClose();
  };

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <SliderMenu title={browser.i18n.getMessage("slippage")} isOpen={open} onClose={onClose}>
      <Flex direction="column" gap={24} height="100%" width="100%">
        <Text variant="secondary" size="sm" weight="medium" noMargin>
          {browser.i18n.getMessage("slippage_description")}
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
