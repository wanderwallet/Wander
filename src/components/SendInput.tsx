import { type InputStatus, Text } from "@arconnect/components-rebrand";
import { ChevronDown, AlertCircle, SearchSm } from "@untitled-ui/icons-react";
import {
  type HTMLProps,
  useState,
  useMemo,
  type CSSProperties,
  type ReactNode
} from "react";
import styled from "styled-components";
import { Flex } from "./common/Flex";

const heights = {
  small: "52px",
  normal: "62px"
} as const;

export function SendInput({
  label,
  fullWidth,
  sizeVariant = "normal",
  status = "default",
  disabled,
  variant = "default",
  iconLeft,
  iconRight,
  errorMessage,
  special,
  inputContainerStyle,
  labelStyle,
  ticker,
  ...props
}: SharedPropsV2 & InputV2Props & HTMLProps<HTMLInputElement>) {
  const [isFocused, setIsFocused] = useState(false);
  const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputV2Props = useMemo<any>(
    () => ({
      fullWidth,
      sizeVariant,
      variant,
      status,
      disabled,
      iconLeft,
      iconRight,
      special,
      ...props
    }),
    [
      fullWidth,
      sizeVariant,
      variant,
      status,
      disabled,
      iconLeft,
      iconRight,
      special,
      props
    ]
  );

  const handleBlur = () => {
    const timeout = setTimeout(() => {
      setIsFocused(false);
      clearTimeout(timeout);
    }, 200);
    setBlurTimeout(timeout);
  };

  const clearInput = (e: React.MouseEvent) => {
    e.preventDefault();
    if (blurTimeout) clearTimeout(blurTimeout);
    setIsFocused(true);
    props?.onChange?.({
      target: { value: "" }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const rightInputIcon = () => {
    if (iconRight) return iconRight;
    if (variant === "dropdown") return <ChevronDown height={20} width={20} />;
    if (props.value && isFocused)
      return <ClearIcon onClick={clearInput} height={20} width={20} />;
    if (status === "error") {
      return <AlertCircle height={20} width={20} color={"#D22B1F"} />;
    }

    return null;
  };

  const leftInputIcon = () => {
    if (iconLeft) return iconLeft;
    if (variant === "search") return <SearchIcon disabled={disabled} />;
    return null;
  };

  const LeftIconComponent = leftInputIcon();
  const RightIconComponent = rightInputIcon();

  return (
    <>
      {label && <LabelV2 style={labelStyle}>{label}</LabelV2>}
      <InputV2Wrapper
        fullWidth={fullWidth}
        sizeVariant={sizeVariant}
        status={status ?? "default"}
        disabled={disabled}
        variant={variant}
        special={special}
        style={inputContainerStyle}
      >
        {LeftIconComponent && (
          <IconWrapperV2 position="left">{LeftIconComponent}</IconWrapperV2>
        )}
        <Flex
          gap={4}
          direction="row"
          align="baseline"
          style={{ minWidth: 0, flex: 1 }}
        >
          <InputV2Element
            {...inputV2Props}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            style={{
              minWidth: "1ch",
              width: `${Math.max(1, props.value?.toString().length || 0)}ch`
            }}
          />
          <Text variant="secondary" style={{ flexShrink: 0 }} noMargin>
            {ticker}
          </Text>
        </Flex>
        {RightIconComponent && (
          <IconWrapperV2 position="right">{RightIconComponent}</IconWrapperV2>
        )}
      </InputV2Wrapper>
      {status === "error" && <ErrorMsg>{errorMessage}</ErrorMsg>}
    </>
  );
}

type InputSize = "small" | "normal";
type InputVariant = "default" | "search" | "dropdown";

export interface SharedPropsV2 {
  fullWidth?: boolean;
  sizeVariant?: InputSize;
  variant?: InputVariant;
  special?: boolean;
  status?: InputStatus;
  disabled?: boolean;
  hasRightIcon?: boolean;
  inputContainerStyle?: CSSProperties;
  labelStyle?: CSSProperties;
  ticker?: string;
}

export interface InputV2Props {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  label?: ReactNode;
  errorMessage?: string;
}

export const InputV2Wrapper = styled.div<SharedPropsV2>`
  position: relative;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: space-between;
  height: ${(props) => heights[props.sizeVariant ?? "normal"]};
  width: ${(props) => (props.fullWidth ? "100%" : "345px")};
  padding: ${(props) => (props.sizeVariant === "small" ? "12px" : "12px 14px")};
  background: ${(props) =>
    props.theme.input.background[props.variant ?? "default"].default};
  border-radius: 10px;
  box-sizing: border-box;
  border: 1.5px solid transparent;

  overflow: hidden;
  color: rgb(${(props) => props.theme.cardBorder});
  transition: border-color 0.13s ease-in-out, background 0.13s ease-in-out;

  ${(props) =>
    props.variant === "dropdown"
      ? `
      border: 1.5px solid  ${
        props.theme.input.border[props.variant || "default"].default
      };
      background: ${
        props.theme.input.background[props.variant || "default"].default
      };
      box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.10), 0px 1px 2px 0px rgba(0, 0, 0, 0.06);
    `
      : props.variant === "search" && props.special
      ? `border: 1.5px solid ${
          props.theme.input.border[props.variant || "default"].special
        }; background:  ${
          props.theme.input.background[props.variant || "default"].special
        };`
      : ``}

  ${(props) =>
    props.status === "error" && `border: 1.5px solid ${props.theme.fail}`};

  &:hover {
    ${(props) =>
      "border: 1.5px solid " +
      (props.status === "error" ? props.theme.fail : "")};
  }

  &:focus-within,
  &:active {
    border: 1.5px solid
      ${(props) =>
        props.status === "error"
          ? props.theme.fail
          : props.theme.input.border[props.variant ?? "default"].focused};
  }

  ${(props) =>
    props.disabled &&
    `
    background: ${
      props.theme.input.background[props.variant ?? "default"].disabled
    };
    border: 1.5px solid ${
      props.theme.input.border[props.variant ?? "default"].disabled
    };
    color: #838383;
  `}
`;

export const LabelV2 = styled.p`
  font-size: 14px;
  font-weight: 500;
  font-family: "Plus Jakarta Sans", sans-serif;
  color: #666;
  margin: 0;
  margin-bottom: 8px;
`;

export const ErrorMsg = styled.p`
  color: ${(props) => props.theme.fail};
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 12px;
  font-weight: 500;
  margin: 0;
`;

export const InputV2Element = styled.input<SharedPropsV2>`
  box-sizing: border-box;
  display: inline-block;
  outline: none;
  border: none;
  background-color: transparent;
  color: ${(props) => props.theme.primaryText};
  width: ${(props) => (props.size ? `${props.size}ch` : "auto")};
  padding: 0;
  margin: 0;

  font-size: 40px;
  font-weight: 500;
  transition: all 0.23s ease-in-out;

  ::-webkit-input-placeholder {
    color: ${(props) =>
      props.theme.input.placeholder[props.variant || "default"]};
  }

  :-ms-input-placeholder {
    color: ${(props) =>
      props.theme.input.placeholder[props.variant || "default"]};
  }

  ::placeholder {
    color: ${(props) =>
      props.theme.input.placeholder[props.variant || "default"]};
  }
`;

export const IconWrapperV2 = styled.div<{ position: "left" | "right" }>`
  font-family: "Plus Jakarta Sans", sans-serif;
  font-weight: 500;
  color: #666;
  cursor: pointer;
`;

const SearchIcon = styled(SearchSm)<{ disabled?: boolean }>`
  color: ${(props) =>
    props.theme.input.icons[
      props.disabled ? "searchInactive" : "searchActive"
    ]};
`;
