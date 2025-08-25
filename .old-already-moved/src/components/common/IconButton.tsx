import { Loading } from "@arconnect/components-rebrand";
import styled from "styled-components";

export const IconButton = styled.button.attrs<ButtonProps>((props) => ({
  children: props.loading ? <Loading style={{ margin: ".18rem 0" }} /> : props.icon ? props.icon : props.children,
}))<ButtonProps>`
  display: flex;
  outline: none;
  cursor: pointer;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  border-radius: 12px;
  text-align: center;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

export interface ButtonProps {
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}
