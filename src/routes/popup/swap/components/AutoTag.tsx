import { Text } from "@arconnect/components-rebrand";
import styled from "styled-components";

interface AutoTagProps {
  slippage: number;
}

export function AutoTag({ slippage }: AutoTagProps) {
  if (slippage !== 0.5) return null;

  return (
    <AutoTagWrapper>
      <Text size="2xs" weight="medium" style={{ color: "#EEE" }} noMargin>
        Auto
      </Text>
    </AutoTagWrapper>
  );
}

const AutoTagWrapper = styled.div`
  display: flex;
  height: 18px;
  padding: 2px 4px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 4px;
  background: #403785;
  box-sizing: border-box;
`;
