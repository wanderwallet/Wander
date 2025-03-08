import styled from "styled-components";

export const HorizontalLine = styled.div<{
  height?: number;
  marginVertical?: number;
}>`
  width: 100%;
  height: ${({ height }) => height || 1}px;
  background: ${({ theme }) => theme.borderSecondary};
  margin: ${({ marginVertical }) => marginVertical || 0}px 0;
`;
