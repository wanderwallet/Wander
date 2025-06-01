import HeadV2 from "~components/popup/HeadV2";
import type { LiquidOpsDepositWithdrawProps } from "./depositwithdraw";
import { Button, Section, Text, Spacer, Input, useInput } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../components/SvgImage";
import UsdaLogo from "url:/assets/ecosystem/usda.svg";
import { AgentStats } from "../components/liquidops/AgentStats";
import { useActiveWallet } from "~wallets/hooks";

export function LiquidOpsConfirm({ params: { action, ticker } }: LiquidOpsDepositWithdrawProps) {
  const passwordInput = useInput();
  const wallet = useActiveWallet();

  async function executeLocal() {}

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("confirm") + " " + browser.i18n.getMessage(action).toLowerCase()} />

      <Wrapper>
        <div>
          <Flex align="center" direction="column" gap={2}>
            <Text size="base" variant="secondary" weight="medium" noMargin>
              {browser.i18n.getMessage(action === "deposit" ? "depositing" : "withdrawing")}
            </Text>
            <Flex align="center" direction="column" gap={4}>
              <Flex align="baseline" gap={4}>
                <Flex align="baseline">
                  <Text size="5xl" weight="medium" noMargin>
                    10
                  </Text>
                  <Text size="base" weight="medium" noMargin>
                    {ticker}
                  </Text>
                </Flex>
                <SvgImageWithBackground height={14} width={14} shape="circle" src={UsdaLogo} iconSize={14} />
              </Flex>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                $10.00 USD
              </Text>
            </Flex>
          </Flex>

          <Spacer y={1.1} />

          <AgentStats
            ticker={ticker}
            apy={action === "deposit" ? 3.43 : undefined} // apy is not defined for withdrawals
            size={0}
            wanderFee={0.0000001}
            transactionFee={0.0000001}
          />

          <Flex direction="column" gap={12} padding="24px 0">
            <Text noMargin weight="medium">
              {browser.i18n.getMessage("sign_enter_password")}
            </Text>
            <Input
              placeholder={browser.i18n.getMessage("enter_password")}
              sizeVariant="small"
              {...passwordInput.bindings}
              type="password"
              fullWidth
              onKeyDown={async (e) => {
                if (e.key !== "Enter") return;

                if (wallet.type === "local") await executeLocal();
                /*else if (!hardwareStatus || hardwareStatus === "play") {
                  setHardwareStatus((val) => (val === "play" ? "scan" : "play"));
                  }*/
              }}
            />
          </Flex>
        </div>

        <Button variant="primary" fullWidth>
          {browser.i18n.getMessage(action)}
        </Button>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  justify-content: space-between;
  padding-top: 0px;
`;
