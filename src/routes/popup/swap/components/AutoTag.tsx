import { Text } from "@wanderapp/components";
import styled from "styled-components";
import browser from "webextension-polyfill";

interface AutoTagProps {
  slippage: number;
}

export function AutoTag({ slippage }: AutoTagProps) {
  if (slippage !== 0.5) return null;

  return (
    <AutoTagWrapper>
      <Text size="2xs" weight="medium" style={{ color: "#EEE" }} noMargin>
        {browser.i18n.getMessage("auto")}
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
