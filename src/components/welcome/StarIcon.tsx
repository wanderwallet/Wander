import styled, { useTheme, keyframes } from "styled-components";
import { useMemo } from "react";

const ANIMATION_FACTORS = [2, 3, 3.5, 5] as const;

const getRandomDuration = (): number => {
  const randomIndex = Math.floor(Math.random() * ANIMATION_FACTORS.length);
  return ANIMATION_FACTORS[randomIndex];
};

interface StarIconProps {
  opacity?: number;
  size?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  position?: "absolute" | "fixed";
  color?: string;
}

export default function StarIcon({
  top,
  left,
  right,
  bottom,
  position = "absolute",
  opacity = 0.4,
  size = 42,
}: StarIconProps) {
  const theme = useTheme();

  const animationDuration = useMemo(() => {
    const factor = getRandomDuration();
    return `${factor}s`;
  }, []);

  return (
    <StarSVG
      xmlns="http://www.w3.org/2000/svg"
      style={{ top, left, right, bottom, position }}
      animationDuration={animationDuration}
      width={size}
      height={size}
      size={size}
      viewBox="0 0 42 42"
      fill="none">
      <path
        opacity={opacity}
        d="M21.0445 0L25.3651 16.2764L41.4801 20.6403L25.3651 25.0042L21.0445 41.2806L16.724 25.0042L0.609009 20.6403L16.724 16.2764L21.0445 0Z"
        fill={theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9"}
      />
    </StarSVG>
  );
}

const shineAnimation = keyframes`
  0% { transform: scale(1.0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1.0); }
`;

const StarSVG = styled.svg<{ size: number; animationDuration: string }>`
  animation-name: ${shineAnimation};
  animation-duration: ${({ animationDuration }) => animationDuration};
  animation-iteration-count: infinite;
  animation-delay: calc(${({ size }) => size / 100} * -3000ms);
`;
