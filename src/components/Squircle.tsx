import { type HTMLProps, useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import styled from "styled-components";
import axios from "axios";

export interface SquircleProps {
  img?: string;
  placeholderText?: string;
  outline?: string;
}

export default function Squircle({
  children,
  img,
  placeholderText,
  outline,
  ...props
}: HTMLProps<HTMLDivElement> & SquircleProps) {
  const [imageData, setImageData] = useState<string>();

  const svgPathId = useMemo(() => uuid(), [img]);

  // load the image with axios
  // we use this to have a nicer loading
  // because otherwise the background looks
  // weird for a second
  useEffect(() => {
    (async () => {
      if (!img) {
        return setImageData(img);
      }

      const { data, headers } = await axios.get(img, {
        responseType: "arraybuffer"
      });
      const base64 = Buffer.from(data, "binary").toString("base64");
      const prefix = "data:" + headers["content-type"] + ";base64, ";

      // append the base64 image string
      setImageData(prefix + base64);
    })();
  }, [img]);

  const outlinePath =
    "M1 30C1 23.8466 1.33102 18.97 2.18954 15.107C3.04554 11.2554 4.41259 8.47287 6.44273 6.44273C8.47287 4.41259 11.2554 3.04554 15.107 2.18954C18.97 1.33102 23.8466 1 30 1C36.1534 1 41.03 1.33102 44.893 2.18954C48.7446 3.04554 51.5271 4.41259 53.5573 6.44273C55.5874 8.47287 56.9545 11.2554 57.8105 15.107C58.669 18.97 59 23.8466 59 30C59 36.1534 58.669 41.03 57.8105 44.893C56.9545 48.7446 55.5874 51.5271 53.5573 53.5573C51.5271 55.5874 48.7446 56.9545 44.893 57.8105C41.03 58.669 36.1534 59 30 59C23.8466 59 18.97 58.669 15.107 57.8105C11.2554 56.9545 8.47287 55.5874 6.44273 53.5573C4.41259 51.5271 3.04554 48.7446 2.18954 44.893C1.33102 41.03 1 36.1534 1 30Z";
  const originalPath =
    "M0 30C0 5.295 5.295 0 30 0C54.705 0 60 5.295 60 30C60 54.705 54.705 60 30 60C5.295 60 0 54.705 0 30Z";

  return (
    <Wrapper {...(props as any)}>
      <SquircleSvg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {imageData && (
          <defs>
            <pattern
              id={svgPathId}
              patternUnits="userSpaceOnUse"
              width="60"
              height="60"
            >
              <image
                xlinkHref={imageData}
                x="0"
                y="0"
                width="60"
                height="60"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          </defs>
        )}

        <path
          d={outline ? outlinePath : originalPath}
          fill={imageData ? `url(#${svgPathId})` : "currentColor"}
          strokeWidth={outline ? 2 : undefined}
          stroke={outline}
        />

        {imageData ? null : (
          <text
            x="50%"
            y="50%"
            alignmentBaseline="central"
            textAnchor="middle"
            fill="white"
            fontSize="2em"
          >
            {placeholderText}
          </text>
        )}
      </SquircleSvg>

      {children}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  width: 1rem;
  height: 1rem;
  color: ${(props) => props.theme.theme};
`;

const SquircleSvg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
