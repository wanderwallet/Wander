import styled from "styled-components";
import { Flex } from "~components/common/Flex";

export const SvgImage = styled.div<{ src: string; size: number; color?: string }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  background-color: ${(props) => props.color || "black"};
  -webkit-mask: url(${(props) => props.src}) no-repeat center;
  mask: url(${(props) => props.src}) no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;
`;

export const SvgImageBackground = ({
  children,
  style,
  size = 40,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  size?: number;
}) => {
  return (
    <Flex
      borderRadius={50}
      align="center"
      justify="center"
      height={size}
      width={size}
      overflow="hidden"
      background="white"
      flexShrink={0}
      style={style}>
      {children}
    </Flex>
  );
};
