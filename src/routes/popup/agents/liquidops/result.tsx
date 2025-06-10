import { Button, Section, Text, Spacer } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

export type LiquidOpsConfirmProps = CommonRouteProps<{
  action: "deposit" | "withdraw";
  ticker: string;
  result: "success" | "failure";
}>;

export function LiquidOpsResult({ params: { action, ticker, result } }: LiquidOpsConfirmProps) {
  const { navigate } = useLocation();

  return (
    <Wrapper>
      <Flex align="column" gap={12}>
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            if (result === "success") {
              navigate(PopupPaths.LiquidOpsAgentsList);
            } else {
              navigate(`/agents/liquidops/${ticker}/${action}`);
            }
          }}>
          {browser.i18n.getMessage(result === "success" ? "view_all_agents" : "try_again")}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            if (result === "success") {
              navigate(`/agents/liquidops/${ticker}`);
            } else {
              navigate("/");
            }
          }}>
          {browser.i18n.getMessage(result === "success" ? "manage_agent" : "go_to_dashboard")}
        </Button>
      </Flex>
    </Wrapper>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: space-between;
`;
