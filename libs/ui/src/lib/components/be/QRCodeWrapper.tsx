import styled from "styled-components";

export const QRCodeWrapper = styled.div<{ size?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => (import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "var(--color-primary, #0D6CE9)" : props.theme.primary)};
  border-radius: 24px;
  padding: 16px;
  width: ${(props) => props.size ?? 176}px;
  height: ${(props) => props.size ?? 176}px;
`;
