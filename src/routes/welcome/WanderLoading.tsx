import { useMemo, useState } from "react";
import styled, { useTheme } from "styled-components";
import wanderLoadingDefault from "assets/lotties/wander-loading-default.json";
import wanderLoadingDefaultLight from "assets/lotties/wander-loading-default-light.json";
import wanderLoadingHover from "assets/lotties/wander-loading-hover.json";
import wanderLoadingHoverLight from "assets/lotties/wander-loading-hover-light.json";
import Lottie from "react-lottie";

export function WanderLoading() {
  const [isHovered, setIsHovered] = useState(false);

  const theme = useTheme();
  const isLight = theme.displayTheme === "light";

  const defaultOptions = useMemo(
    () => ({
      loop: true,
      autoplay: true,
      animationData: isLight
        ? isHovered
          ? wanderLoadingHoverLight
          : wanderLoadingDefaultLight
        : isHovered
        ? wanderLoadingHover
        : wanderLoadingDefault,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice"
      }
    }),
    [isLight, isHovered]
  );

  return (
    <LottieWrapper
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* @ts-ignore */}
      <Lottie
        options={defaultOptions}
        height={111.219}
        width={219.328}
        isClickToPauseDisabled={true}
        isPaused={false}
      />
    </LottieWrapper>
  );
}

const LottieWrapper = styled.div`
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
`;
