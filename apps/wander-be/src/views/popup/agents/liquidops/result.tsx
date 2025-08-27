import { Button, Section, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import HedgehogSuccessImage from "react:/assets/agents/hedgehog-success.svg";
import HedgehogFailureImage from "react:/assets/agents/hedgehog-failure.svg";
import SuccessImage from "react:/assets/agents/success.svg";
import FailureImage from "react:/assets/agents/failure.svg";
import { PageType, trackPage } from "~utils/analytics";
import { useEffect } from "react";

export type LiquidOpsConfirmProps = CommonRouteProps<{
  action: "deposit" | "withdraw";
  ticker: string;
  result: "success" | "failure";
}>;

export function LiquidOpsResult({ params: { action, ticker, result } }: LiquidOpsConfirmProps) {
  const { navigate, back } = useLocation();
  const hedgehogSvgProps: React.SVGProps<SVGSVGElement> = {
    width: 119,
    height: 128,
  };
  const resultIconSvgProps: React.SVGProps<SVGSVGElement> = {
    width: 76,
    height: 76,
  };

  useEffect(() => {
    if (!action || !result) return;

    trackPage(
      result === "success"
        ? action === "deposit"
          ? PageType.LIQUID_OPS_AGENT_DEPOSIT_SUCCESS
          : PageType.LIQUID_OPS_AGENT_WITHDRAW_SUCCESS
        : action === "deposit"
          ? PageType.LIQUID_OPS_AGENT_DEPOSIT_FAILURE
          : PageType.LIQUID_OPS_AGENT_WITHDRAW_FAILURE,
    );
  }, [action, result]);

  return (
    <Wrapper>
      <Flex direction="column" flex={1} align="center" justify="center" gap={18}>
        <HedgehogWrapper>
          <ResultIconWrapper>
            {result === "success" ? <SuccessImage {...resultIconSvgProps} /> : <FailureImage {...resultIconSvgProps} />}
          </ResultIconWrapper>
          {result === "success" ? (
            <HedgehogSuccessImage {...hedgehogSvgProps} />
          ) : (
            <HedgehogFailureImage {...hedgehogSvgProps} />
          )}
        </HedgehogWrapper>
        <TextContainer>
          <Title>{browser.i18n.getMessage(`${action}_${result}`, [ticker])}</Title>
          <SubTitle>
            {browser.i18n.getMessage(
              result === "success" ? `${action}_success_subtext` : "deposit_withdraw_failure_subtext",
              [ticker],
            )}
          </SubTitle>
        </TextContainer>
      </Flex>

      <Flex direction="column" gap={12}>
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            if (result === "success") {
              navigate(PopupPaths.LiquidOpsAgentsList);
            } else {
              // double back to go to create agent page
              back();
              back();
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
  height: calc(100vh - 24px * 2);
  justify-content: space-between;
`;

const HedgehogWrapper = styled.div`
  position: relative;
  width: auto;
  z-index: 1;
`;

const ResultIconWrapper = styled.div`
  position: absolute;
  bottom: 70%;
  left: 70%;
  z-index: -1;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  max-width: 90%;
`;

const Title = styled(Text).attrs({
  noMargin: true,
  weight: "bold",
})`
  font-size: 22px;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const SubTitle = styled(Text).attrs({
  noMargin: true,
  variant: "secondary",
  size: "sm",
})`
  display: flex;
  flex-wrap: wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: center;
`;
