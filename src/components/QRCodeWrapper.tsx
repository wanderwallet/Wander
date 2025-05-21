import styled from "styled-components";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

export const QRCodeWrapper = styled.div<{ size?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => (IS_EMBEDDED_APP ? "var(--color-primary, #0D6CE9)" : props.theme.primary)};
  border-radius: 24px;
  padding: 16px;
  width: ${(props) => props.size ?? 176}px;
  height: ${(props) => props.size ?? 176}px;
`;
