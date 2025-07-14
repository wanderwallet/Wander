import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";

interface ToggleSwitchProps {
  checked: boolean;
  setChecked: Dispatch<SetStateAction<boolean>>;
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

export const ToggleSwitch = ({ checked, setChecked, width = 44, height = 22, children }: ToggleSwitchProps) => {
  const [state, setState] = useState(checked);

  const handleChange = () => {
    const newState = !state;
    setState(newState);
    setChecked(newState);
  };

  useEffect(() => {
    setState(checked);
  }, [checked]);

  return (
    <Flex gap={8}>
      <SwitchWrapper width={width} height={height}>
        <Checkbox width={width} height={height} type="checkbox" onChange={handleChange} />
        <Slider width={width} height={height} checked={state} />
      </SwitchWrapper>
      {children}
    </Flex>
  );
};

const SwitchWrapper = styled.label<{ width: number; height: number }>`
  position: relative;
  display: inline-block;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  flex-shrink: 0;
`;

const Slider = styled.span<{ width: number; height: number; checked: boolean }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${(props) => (props.checked ? "linear-gradient(47deg, #5842F8 5.41%, #6B57F9 96%)" : "#E5E7EB")};
  transition: all 0.3s ease-in-out;
  border-radius: ${(props) => props.height / 2}px;
  will-change: transform, background;

  &:before {
    position: absolute;
    content: "";
    height: ${(props) => props.height - 5}px;
    width: ${(props) => props.height - 5}px;
    left: 2.5px;
    bottom: 2.5px;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.15);
    transform: translate3d(${(props) => (props.checked ? props.width - props.height : 0)}px, 0, 0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
`;

const Checkbox = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;
