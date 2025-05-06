import type { HTMLProps } from "react";
import styled from "styled-components";

const Progress = ({ percentage, ...props }: HTMLProps<HTMLDivElement> & Props) => (
  <Wrapper {...(props as any)}>
    <Line style={{ width: `${percentage}%` }} />
  </Wrapper>
);

interface Props {
  percentage: number;
}

const Wrapper = styled.div`
  position: relative;
  height: 18px;
  background-color: rgba(${(props) => props.theme.theme}, 0.15);
  border-radius: 9px;
  overflow: hidden;
`;

const Line = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100%;
  background-color: rgb(${(props) => props.theme.theme});
  border-radius: 9px;
  transition: all 0.23s ease-in-out;
`;

export default Progress;
