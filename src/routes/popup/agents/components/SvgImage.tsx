import styled, { useTheme } from "styled-components";
import { useMemo } from "react";
import { Flex } from "~components/common/Flex";

interface SvgImageBackgroundProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  height?: number;
  width?: number;
  shape?: "circle" | "hexagon";
  hasBorder?: boolean;
  background?: string;
  gradientStart?: string;
  gradientStop?: string;
  gradientDirection?: string;
  src?: string;
  iconSize?: number;
  iconColor?: string;
  iconStyle?: React.CSSProperties;
}

export const SvgImage = styled.div<{ src: string; size: number; color?: string }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  flex-shrink: 0;
  ${(props) =>
    props.color
      ? `
    /* Use mask when color is provided for color changes */
    background-color: ${props.color};
    -webkit-mask: url(${props.src}) no-repeat center;
    mask: url(${props.src}) no-repeat center;
    -webkit-mask-size: contain;
    mask-size: contain;
  `
      : `
    /* Use background-image when no color change is needed */
    background-image: url(${props.src});
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  `}
`;

const HEXAGON_PATH =
  "M20.5 2.30957C21.6602 1.63972 23.0729 1.59753 24.2646 2.18359L24.5 2.30957L38.5527 10.4229C39.7902 11.1374 40.5527 12.4578 40.5527 13.8867V30.1133C40.5527 31.4529 39.8827 32.6975 38.7793 33.4365L38.5527 33.5771L24.5 41.6904C23.3398 42.3603 21.9271 42.4025 20.7354 41.8164L20.5 41.6904L6.44727 33.5771C5.2098 32.8626 4.44728 31.5422 4.44727 30.1133V13.8867C4.44728 12.5471 5.1173 11.3025 6.2207 10.5635L6.44727 10.4229L20.5 2.30957Z";

export const SvgImageWithBackground = ({
  children,
  style,
  height = 40,
  width = 40,
  shape = "circle",
  hasBorder = false,
  background = "white",
  gradientStart,
  gradientStop,
  gradientDirection = "135deg",
  src,
  iconSize,
  iconColor,
  iconStyle,
}: SvgImageBackgroundProps) => {
  const theme = useTheme();

  const backgroundStyle = useMemo(() => {
    if (gradientStart && gradientStop) {
      return `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientStop})`;
    }
    return background;
  }, [gradientStart, gradientStop, gradientDirection, background]);

  const hexagonProps = useMemo(() => {
    if (shape !== "hexagon") return null;

    const hasGradient = !!(gradientStart && gradientStop);
    const gradientId = hasGradient ? `hex-grad-${width}x${height}` : undefined;

    return {
      hasGradient,
      gradientId,
      fill: hasGradient ? `url(#${gradientId})` : background,
      stroke: hasBorder ? theme.primary : "none",
      strokeWidth: hasBorder ? 2 : 0,
    };
  }, [shape, gradientStart, gradientStop, background, hasBorder, theme.primary, width, height]);

  const renderContent = () => {
    if (src) {
      return (
        <SvgImage src={src} size={iconSize || Math.min(width, height) * 0.6} color={iconColor} style={iconStyle} />
      );
    }
    return children;
  };

  if (shape === "hexagon" && hexagonProps) {
    return (
      <HexagonWrapper size={{ width, height }} style={style}>
        <svg
          width={width}
          height={height}
          viewBox="0 0 45 44"
          style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}>
          {hexagonProps.hasGradient && (
            <defs>
              <linearGradient
                id={hexagonProps.gradientId}
                x1="0%"
                y1="100%"
                x2="0%"
                y2="0%"
                gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={gradientStop} />
                <stop offset="100%" stopColor={gradientStart} />
              </linearGradient>
            </defs>
          )}
          <path
            d={HEXAGON_PATH}
            fill={hexagonProps.fill}
            stroke={hexagonProps.stroke}
            strokeWidth={hexagonProps.strokeWidth}
          />
        </svg>
        <HexagonContent>{renderContent()}</HexagonContent>
      </HexagonWrapper>
    );
  }

  return (
    <Flex
      align="center"
      justify="center"
      height={height}
      width={width}
      overflow="hidden"
      background={backgroundStyle}
      flexShrink={0}
      style={{
        borderRadius: 50,
        border: hasBorder ? `2px solid ${theme.primary}` : "none",
        ...style,
      }}>
      {renderContent()}
    </Flex>
  );
};

const HexagonWrapper = styled.div<{ size: { width: number; height: number } }>`
  position: relative;
  width: ${(props) => props.size.width}px;
  height: ${(props) => props.size.height}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HexagonContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;
