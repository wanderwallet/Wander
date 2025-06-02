import styled, { useTheme } from "styled-components";
import { Button, Input, Section, useInput, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../components/SvgImage";
import confirmAgentImage from "url:/assets/agents/confirm-agent.svg";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { ExtensionStorage, TempTransactionStorage, useStorage } from "~utils/storage";
import type { AOYieldAgentCreate } from "./create-agent";
import { PropertyName, PropertyValue, TransactionProperty } from "~routes/popup/transaction/[id]";
import { useMemo } from "react";
import dayjs from "dayjs";
import { useAskPassword } from "~wallets/hooks";
import { checkPassword } from "~wallets/auth";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

export function ConfirmAOYieldAgentView() {
  const toasts = useToasts();
  const { navigate } = useLocation();
  const askPassword = useAskPassword();
  const passwordInput = useInput();
  const theme = useTheme();
  const [aoYieldAgent] = useStorage<AOYieldAgentCreate>({ key: "ao-yield-agent", instance: TempTransactionStorage });
  const [transferRequirePassword] = useStorage(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage,
    },
    false,
  );

  const isButtonDisabled = useMemo(
    () => askPassword && transferRequirePassword && !passwordInput.state,
    [askPassword, transferRequirePassword, passwordInput.state],
  );

  const properties = useMemo(() => {
    if (!aoYieldAgent) return [];

    const { percentage, asset, startDate, endDate, runIndefinitely, slippage } = aoYieldAgent;
    const runningTime = runIndefinitely ? "∞" : `${dayjs(endDate).diff(dayjs(startDate), "day") + 1} days`;

    return [
      { name: "daily_conversion", value: `${percentage}% of AO earnings` },
      { name: "buy_asset", value: `${asset.ticker}` },
      { name: "running_time", value: runningTime },
      { name: "start_date", value: dayjs(startDate).format("MMM D, YYYY") },
      { name: "end_date", value: dayjs(endDate).format("MMM D, YYYY") },
      { name: "slippage", value: `${slippage}%` },
      { name: "fee", value: "0.5% of each conversion" },
    ];
  }, [aoYieldAgent]);

  async function handleActiveAgent() {
    if (askPassword && transferRequirePassword) {
      const checkPw = await checkPassword(passwordInput.state);
      if (!checkPw) {
        toasts.setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400,
        });
        return;
      }
    }
    // TODO: Agent deployment

    navigate(PopupPaths.AOYieldAgentActivated, { search: { activationStatus: "success" } });
  }

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("confirm_agent")} />
      <Wrapper>
        <Content>
          <Flex align="center" justify="space-around">
            <SvgImageWithBackground
              height={53.3}
              width={53.3}
              style={{ position: "absolute", left: 36 }}
              src={aoLogo}
              iconSize={36}
              iconColor="black"
            />
            <img
              style={{
                width: 330,
                height: 128,
                flexShrink: 0,
              }}
              src={confirmAgentImage}
              alt="confirm agent"
            />
            <img
              src={aoYieldAgent?.asset?.logo}
              height={53.3}
              width={53.3}
              style={{ position: "absolute", right: 36 }}
            />
          </Flex>
          <Flex direction="column" gap={8}>
            {properties.map((property, i) => (
              <TransactionProperty key={`property-${i}`}>
                <PropertyName>{browser.i18n.getMessage(property.name)}</PropertyName>
                <PropertyValue>
                  {property.value}
                  {i === 1 && aoYieldAgent?.asset?.logo && <img src={aoYieldAgent.asset.logo} height={18} width={18} />}
                </PropertyValue>
              </TransactionProperty>
            ))}
          </Flex>
          {askPassword && transferRequirePassword && (
            <Input
              placeholder="Password"
              sizeVariant="small"
              {...passwordInput.bindings}
              label={"Enter password to confirm"}
              labelStyle={{ marginBottom: -4, color: theme.primaryText }}
              type="password"
              onKeyDown={async (e) => {
                if (e.key !== "Enter") return;
                await handleActiveAgent();
              }}
              fullWidth
            />
          )}
        </Content>
        <Flex gap={8}>
          <Button style={{ flex: 1 }} disabled={isButtonDisabled} onClick={handleActiveAgent} fullWidth>
            {browser.i18n.getMessage(isButtonDisabled ? "enter_password" : "activate_agent")}
          </Button>
        </Flex>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  height: calc(100vh - 100px);
  background-color: ${({ theme }) => theme.background};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  height: 100%;
  gap: 16px;
`;
