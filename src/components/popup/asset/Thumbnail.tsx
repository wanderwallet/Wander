import type { DisplayTheme } from "@arconnect/components";
import { MaximizeIcon } from "@iconicicons/react";
import { useTheme } from "~utils/theme";
import styled from "styled-components";
import { useState } from "react";

export default function Thumbnail({ src, fallback }: Props) {
  // display theme
  const theme = useTheme();

  // full view
  const [fullView, setFullView] = useState(false);

  return (
    <ThumbnailImage
      src={src}
      fallback={fallback}
      displayTheme={theme}
      onClick={() => setFullView((v) => !v)}
      fullView={fullView}
    >
      <FullScreenButton
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <MaximizeIcon />
      </FullScreenButton>
    </ThumbnailImage>
  );
}

const ThumbnailImage = styled.div<{
  displayTheme: DisplayTheme;
  src: string;
  fallback?: string;
  fullView: boolean;
}>`
  position: relative;
  width: 100%;
  padding-top: 100%;
  background-color: rgb(
    ${(props) =>
      props.displayTheme === "light" ? "0, 0, 0" : props.theme.cardBackground}
  );
  background-size: ${(props) => (props.fullView ? "contain" : "cover")};
  background-image: url(${(props) => props.src}),
    ${(props) => (props.fallback ? `url(${props.fallback})` : "")};
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
`;

const FullScreenButton = styled.a`
  position: absolute;
  display: block;
  right: 1.2rem;
  bottom: 1.2rem;
  width: 33px;
  height: 33px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  text-decoration: none;
  border-radius: 100%;
  transition: all 0.07s ease-in-out;

  &:active {
    transform: scale(0.92);
  }

  svg {
    position: absolute;
    top: 50%;
    left: 50%;
    color: #fff;
    font-size: 1em;
    width: 25px;
    height: 25px;
    transform: translate(-50%, -50%);
  }
`;

interface Props {
  src: string;
  fallback?: string;
}
