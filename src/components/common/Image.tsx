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
  style,
}: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <ImageWrapper
      className={className}
      style={style}
      $borderRadius={borderRadius}
      $placeholderUrl={placeholderUrl}
      $objectFit={objectFit}>
      <motion.img
        src={src}
        width={width}
        height={height}
        alt={alt}
        draggable={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: transitionDuration }}
        onLoad={() => setIsLoaded(true)}
        style={{
          display: "block",
          //width: "100%",
          //height: "100%",
          //objectFit,
          //borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
          background: backgroundColor,
          //position: "relative",
          //zIndex: 0,
        }}
      />
    </ImageWrapper>
  );
}

const ImageWrapper = styled.picture<{
  $borderRadius: number | string;
  $placeholderUrl: string;
  $objectFit: string;
}>`
  display: block;
  // position: relative;
  border-radius: ${(props) =>
    typeof props.$borderRadius === "number" ? `${props.$borderRadius}px` : props.$borderRadius};
  overflow: hidden;
  backgroundimage: ${(props) => props.$placeholderUrl};
  backgroundsize: ${(props) => props.$objectFit};
  backgroundposition: center;
  backgroundrepeat: no-repeat;
`;
