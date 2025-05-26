import { Text } from "@arconnect/components-rebrand";
import styled from "styled-components";

export const InputButton = ({
  label,
  body,
  icon,
  onClick,
  disabled,
  style,
  innerStyle,
  outerLabel,
}: {
  label?: string;
  body: string | React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  outerLabel?: boolean;
}) => {
  return (
    <div>
      {outerLabel && label && <Label outer={outerLabel}>{label}</Label>}
      <InputButtonWrapper onClick={onClick} disabled={disabled} style={style}>
        {!outerLabel && label && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
              gap: "4px",
            }}>
            <Text size="sm" noMargin weight="medium" variant="secondary">
              {label}
            </Text>
            <div style={innerStyle}>{body}</div>
          </div>
        )}
        {outerLabel && <div style={innerStyle}>{body}</div>}
        {icon}
      </InputButtonWrapper>
    </div>
  );
};

const InputButtonWrapper = styled.button`
  background: ${(props) => props.style?.background ?? "none"};
  color: ${(props) => props.theme.primaryTextv2};
  font-size: ${(props) => props.style?.fontSize ?? "16px"};
  display: flex;
  height: ${(props) => props.style?.height ?? "42px"};
  padding: 12px;
  border-radius: 10px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};

  &:hover {
    border-color: ${(props) => !props.disabled && props.theme.primaryTextv2};
  }
`;

const Label = styled.div<{ outer?: boolean }>`
  margin: ${(props) => props.style?.margin || "0"};
  padding-top: ${(props) => props.style?.paddingTop || "0px"};
  padding-bottom: ${(props) => props.style?.paddingBottom || "8px"};
  font-size: ${(props) => props.style?.fontSize || "16px"};
  color: ${(props) => (props.outer ? props.theme.primaryText : props.theme.secondaryText)};
`;
