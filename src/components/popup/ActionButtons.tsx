import { Button } from "@arconnect/components-rebrand";
import styled from "styled-components";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import type { ReactNode } from "react";

export interface ButtonConfig {
  text: string;
  icon: ReactNode;
  href: WanderRoutePath;
  variant?: "primary" | "secondary";
  iconPosition?: "left" | "right";
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
        <ConfigurableButton
          key={index}
          onClick={() => navigate(button.href)}
          variant={button.variant || "secondary"}
          icon={button.icon}
          iconPosition={button.iconPosition}
          $buttonCount={buttonCount}
          $isFirst={index === 0 && buttonCount === 3}>
          {button.text}
        </ConfigurableButton>
      ))}
    </Container>
  );
}

const ConfigurableButton = styled(Button)<{ $buttonCount: number; $isFirst: boolean }>`
  box-sizing: border-box;
  min-width: 0;

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

const Container = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;
