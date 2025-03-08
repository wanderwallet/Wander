import { useState } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import placeholderUrl from "url:/assets/placeholder.png";

interface ImageProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  borderRadius?: number | string;
  backgroundColor?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  transitionDuration?: number;
  style?: React.CSSProperties;
}

export default function Image({
  src,
  alt = "",
  width = "100%",
  height = "100%",
  className,
  borderRadius = 0,
  backgroundColor = "transparent",
  objectFit = "cover",
  transitionDuration = 0.2,
  style
}: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <ImageWrapper
      width={width}
      height={height}
      className={className}
      borderRadius={borderRadius}
      style={style}
    >
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoaded ? 0 : 1 }}
        transition={{ duration: transitionDuration }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius:
            typeof borderRadius === "number"
              ? `${borderRadius}px`
              : borderRadius,
          overflow: "hidden",
          backgroundImage: `url(${placeholderUrl})`,
          backgroundSize: objectFit,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 1
        }}
      />

      <motion.img
        src={src}
        alt={alt}
        draggable={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: transitionDuration }}
        onLoad={() => setIsLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          borderRadius:
            typeof borderRadius === "number"
              ? `${borderRadius}px`
              : borderRadius,
          background: backgroundColor,
          position: "relative",
          zIndex: 0
        }}
      />
    </ImageWrapper>
  );
}

const ImageWrapper = styled.div<{
  width: number | string;
  height: number | string;
  borderRadius: number | string;
}>`
  position: relative;
  width: ${(props) =>
    typeof props.width === "number" ? `${props.width}px` : props.width};
  height: ${(props) =>
    typeof props.height === "number" ? `${props.height}px` : props.height};
  border-radius: ${(props) =>
    typeof props.borderRadius === "number"
      ? `${props.borderRadius}px`
      : props.borderRadius};
  overflow: hidden;
`;
