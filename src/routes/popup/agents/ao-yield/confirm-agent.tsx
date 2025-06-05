import styled, { useTheme } from "styled-components";
import { Button, Input, Section, useInput, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../components/SvgImage";
import confirmAgentImage from "url:/assets/agents/images/confirm-agent.svg";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { ExtensionStorage, TempTransactionStorage, useStorage } from "~utils/storage";
import { PropertyName, PropertyValue, TransactionProperty } from "~routes/popup/transaction/[id]";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useAskPassword } from "~wallets/hooks";
import { checkPassword } from "~wallets/auth";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { deployContract } from "~utils/agents/deploy";
import aoYieldAgentContract from "raw:/assets/agents/contracts/ao-yield-agent.lua";
import { getActiveAddress } from "~wallets/wallets.utils";
import type { AOYieldAgentCreate, AOYieldAgentStatus } from "~utils/agents/types";
import { getAOYieldAgents, setAOYieldAgents } from "~utils/agents/utils";
import { performSwapIfNeeded } from "~utils/agents/mint";

export function ConfirmAOYieldAgentView() {
  const [isLoading, setIsLoading] = useState(false);
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

    const { conversionPercentage, asset, startDate, endDate, runIndefinitely, slippage } = aoYieldAgent;
    const days = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
    const runningTime = runIndefinitely ? "∞" : `${days} ${days === 1 ? "day" : "days"}`;

    return [
      { name: "daily_conversion", value: `${conversionPercentage}% of AO earnings` },
      { name: "buy_asset", value: `${asset.ticker}` },
      { name: "running_time", value: runningTime },
      { name: "start_date", value: dayjs(startDate).format("MMM D, YYYY") },
      { name: "end_date", value: dayjs(endDate).format("MMM D, YYYY") },
      { name: "slippage", value: `${slippage}%` },
      { name: "fee", value: browser.i18n.getMessage("percentage_of_each_conversion", ["0.5"]) },
    ];
  }, [aoYieldAgent]);

  async function handleActiveAgent() {
    if (!aoYieldAgent) return;

    setIsLoading(true);

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

    try {
      const { processId } = await deployContract({
        name: "ao-yield-agent",
        contractPath: aoYieldAgentContract,
        tags: [
          {
            name: "Conversion-Percentage",
            value: aoYieldAgent.conversionPercentage.toString(),
          },
          {
            name: "Token-Out",
            value: aoYieldAgent.asset.id,
          },
          {
            name: "Start-Date",
            value: aoYieldAgent.startDate.toString(),
          },
          {
            name: "End-Date",
            value: aoYieldAgent.endDate.toString(),
          },
          {
            name: "Run-Indefinitely",
            value: aoYieldAgent.runIndefinitely.toString(),
          },
          {
            name: "Slippage",
            value: aoYieldAgent.slippage.toString(),
          },
        ],
        forceSpawn: true,
      });

      const activeAddress = await getActiveAddress();
      const agents = await getAOYieldAgents(activeAddress);

      agents.push({
        id: processId,
        status: "Active" as AOYieldAgentStatus,
        conversionPercentage: aoYieldAgent.conversionPercentage,
        tokenOut: aoYieldAgent.asset.id,
        startDate: aoYieldAgent.startDate,
        endDate: aoYieldAgent.endDate,
        runIndefinitely: aoYieldAgent.runIndefinitely,
        slippage: aoYieldAgent.slippage,
      });

      await setAOYieldAgents(activeAddress, agents);

      navigate(PopupPaths.AOYieldAgentActivated, { search: { activationStatus: "success" } });

      TempTransactionStorage.remove("ao-yield-agent");

      // TODO: remove this after testing
      setTimeout(() => {
        performSwapIfNeeded().catch((error) => {
          console.log("error: ", error);
        });
      }, 5000);
    } catch (error) {
      console.log("error: ", error);
      navigate(PopupPaths.AOYieldAgentActivated, { search: { activationStatus: "error" } });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("confirm_agent")} />
      <Wrapper>
        <Content>
          <Flex
            align="center"
            justify="space-around"
            style={{
              maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
            }}>
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
              label={browser.i18n.getMessage("enter_password_confirm")}
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
          <Button disabled={isButtonDisabled || isLoading} onClick={handleActiveAgent} loading={isLoading} fullWidth>
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
