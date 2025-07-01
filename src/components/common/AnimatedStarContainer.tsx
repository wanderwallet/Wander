import type { ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";
import { XClose } from "@untitled-ui/icons-react";
import { IconButton } from "~components/common/IconButton";
import { Flex } from "~components/common/Flex";
import StarIcon from "~components/welcome/StarIcon";

interface StarConfig {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  size: number;
  opacity: number;
  filter?: string;
}

interface AnimatedStarContainerProps {
  children: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  padding?: string;
  borderRadius?: number;
  gap?: number;
  stars?: StarConfig[];
  className?: string;
}

export const defaultStars: StarConfig[] = [
  { top: -36, right: 9, size: 82, opacity: 0.3, filter: "blur(3px)" },
  { top: 32, left: -8, size: 32, opacity: 0.4, filter: "blur(1.5px)" },
  { top: 24, right: 74, size: 24, opacity: 0.4, filter: "blur(1.5px)" },
  { bottom: 8, right: -4, size: 32, opacity: 0.4, filter: "blur(1.5px)" },
];

export function AnimatedStarContainer({
  children,
  onClose,
  showCloseButton = false,
  padding = "8px 12px 10px 12px",
  borderRadius = 10,
  gap = 12,
  stars = defaultStars,
  className,
}: AnimatedStarContainerProps) {
  return (
    <AnimatedContainer className={className}>
      <Flex
        direction="column"
        padding={padding}
        borderRadius={borderRadius}
        gap={gap}
        overflow="hidden"
        style={{ position: "relative" }}>
        {showCloseButton && onClose && (
          <CloseButtonWrapper>
            <IconButton
              icon={<XClose style={{ width: 24, height: 24, cursor: "pointer" }} />}
              onClick={onClose}
              style={{ zIndex: 1 }}
            />
          </CloseButtonWrapper>
        )}

        <ContentWrapper hasCloseButton={showCloseButton}>{children}</ContentWrapper>

        {stars.map((star, index) => (
          <StarIcon
            key={index}
            top={star.top}
            bottom={star.bottom}
            left={star.left}
            right={star.right}
            size={star.size}
            opacity={star.opacity}
            filter={star.filter}
            shineAnimation={shineAnimation}
          />
        ))}
      </Flex>
    </AnimatedContainer>
  );
}

const shineAnimation = keyframes`
  0% { transform: scale(1.0); opacity: 0.4; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1.0); opacity: 0.4; }
`;

const borderGradientRotate = keyframes`
  from { --angle: 0deg; }
  to { --angle: 360deg; }
`;

const AnimatedContainer = styled.div`
  position: relative;
  padding: 1.2px;
  border-radius: 12px;

  @property --angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    --angle: 0deg;
    background: conic-gradient(
      from var(--angle),
      #6b57f9 0deg,
      rgba(107, 87, 249, 0.8) 45deg,
      rgba(107, 87, 249, 0.4) 90deg,
      rgba(107, 87, 249, 0.2) 135deg,
      rgba(107, 87, 249, 0.3) 180deg,
      rgba(107, 87, 249, 0.5) 225deg,
      rgba(107, 87, 249, 0.8) 270deg,
      rgba(107, 87, 249, 0.9) 315deg,
      #6b57f9 360deg
    );
    animation: ${borderGradientRotate} 3s linear infinite;
    z-index: 0;
  }

  & > div:first-child {
    position: relative;
    z-index: 1;
    border-radius: 10px;
    background: linear-gradient(180deg, #fff 76.26%, #e3d8f6 100%);
    box-shadow: 0px 2px 3.3px 0px rgba(0, 0, 0, 0.07) inset;

    ${({ theme }) =>
      theme.displayTheme === "dark" &&
      css`
        background: linear-gradient(180deg, #26126f 0%, #111 96.95%);
      `}
  }
`;

const CloseButtonWrapper = styled.div`
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 2;
`;

const ContentWrapper = styled.div<{ hasCloseButton: boolean }>`
  width: 100%;
  ${({ hasCloseButton }) =>
    hasCloseButton &&
    css`
      padding-right: 40px;
    `}
`;
