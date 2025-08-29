import { Button } from "@arconnect/components-rebrand";
import styled from "styled-components";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import type { ReactNode } from "react";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { EventType, trackEvent } from "~utils/analytics";

export interface ButtonConfig {
  text: string;
  icon: ReactNode;
  href: WanderRoutePath;
  disabledTag?: ReactNode;
  variant?: "primary" | "secondary";
  iconPosition?: "left" | "right";
  disabled?: boolean;
}

interface ActionButtonsProps {
  buttons?: ButtonConfig[];
}

export function ActionButtons({ buttons }: ActionButtonsProps) {
  const { navigate } = useLocation();
  const buttonConfigs = buttons || [];
  const buttonCount = buttonConfigs.length;

  return (
    <Container>
      {buttonConfigs.map((button, index) => (
        <ConfigurableButtonWrapper key={index} $buttonCount={buttonCount} $isFirst={index === 0 && buttonCount === 3}>
          <ConfigurableButton
            onClick={() => {
              if (button.href === PopupPaths.Swap) {
                trackEvent(EventType.SWAP_BUTTON, {});
              }
              navigate(button.href);
            }}
            variant={button.variant || "secondary"}
            icon={button.icon}
            iconPosition={button.iconPosition}
            disabled={button.disabled}>
            {button.text}
          </ConfigurableButton>
          {button.disabled && button.disabledTag && <DisabledTag>{button.disabledTag}</DisabledTag>}
        </ConfigurableButtonWrapper>
      ))}
    </Container>
  );
}

const ConfigurableButton = styled(Button)`
  box-sizing: border-box;
  min-width: 0;
  width: 100%;

  &:disabled {
    pointer-events: none;
  }
`;

const ConfigurableButtonWrapper = styled.div<{ $buttonCount: number; $isFirst: boolean }>`
  position: relative;

  ${({ $buttonCount, $isFirst }) => {
    if ($buttonCount === 2) {
      return `
        width: calc(50% - 4px);
        &:not(:last-child) {
          margin-right: 8px;
        }
      `;
    }

    if ($buttonCount === 3 && $isFirst) {
      return `
        width: 50%;
        margin-right: 8px;
      `;
    }

    if ($buttonCount === 3 && !$isFirst) {
      return `
        width: calc(25% - 4px);
        &:not(:last-child) {
          margin-right: 8px;
        }
      `;
    }

    // For other counts, distribute equally
    return `
      width: calc(${100 / $buttonCount}% - ${(($buttonCount - 1) * 8) / $buttonCount}px);
      &:not(:last-child) {
        margin-right: 8px;
      }
    `;
  }}
`;

const DisabledTag = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
`;

const Container = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;
`;
