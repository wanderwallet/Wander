import type React from "react";
import Lottie from "react-lottie";
import wanderLogo from "assets/lotties/wander-logo.json";
import wanderLogoLight from "assets/lotties/wander-logo-light.json";
import { useTheme } from "styled-components";

interface WanderLogoProps {
  width?: number;
  height?: number;
  setShowSplash: (showSplash: boolean) => void;
}

const UpdateSplash: React.FC<WanderLogoProps> = ({
  width = 250,
  height = 250,
  setShowSplash
}) => {
  const theme = useTheme();
  const isLight = theme.displayTheme === "light";

  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: isLight ? wanderLogoLight : wanderLogo,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    <div style={{ width, height }}>
      <Lottie
        eventListeners={[
          { eventName: "complete", callback: () => setShowSplash(false) }
        ]}
        options={defaultOptions}
        height={250}
        width={250}
      />
    </div>
  );
};

export default UpdateSplash;
