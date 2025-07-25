import { CurrencyDollarCircle } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import { useMemo } from "react";
import { ActionButtons, type ButtonConfig } from "../ActionButtons";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import HedgehogHeadIcon from "url:/assets/agents/images/hedgehog-head.svg";
import { ReceiveIcon } from "~components/icons/ReceiveIcon";
import { AO_PROCESS_ID, AR_PROCESS_ID, PI_PROCESS_ID, WAR_PROCESS_ID, WUSDC_PROCESS_ID } from "~tokens/aoTokens/ao";
import { useFairLaunchTokens } from "~utils/fair_launch/fair_launch.hooks";
import { tokenData } from "liquidops";

interface TokenActionButtonsProps {
  id: string;
}

const purchaseButtonConfig: ButtonConfig = {
  text: browser.i18n.getMessage("buy_ar_button"),
  icon: <img src={arLogoDark} style={{ height: 18.5, width: 18.5 }} alt="Buy AR" />,
  href: "/purchase",
  variant: "primary",
  iconPosition: "right",
};

const earnButtonConfigWithoutText: ButtonConfig = {
  text: "",
  icon: <CurrencyDollarCircle style={{ height: 22, width: 22 }} />,
  href: "/earn",
  variant: "secondary",
};

const earnButtonConfig: ButtonConfig = {
  ...earnButtonConfigWithoutText,
  text: browser.i18n.getMessage("earn"),
  variant: "primary",
  iconPosition: "right",
};

const agentsButtonConfigWithoutText: ButtonConfig = {
  text: "",
  icon: <img src={HedgehogHeadIcon} style={{ height: 26, width: 26 }} alt="Agents" />,
  href: "/agents",
  variant: "secondary",
};

const agentsButtonConfig: ButtonConfig = {
  ...agentsButtonConfigWithoutText,
  text: browser.i18n.getMessage("agents"),
  variant: "primary",
  iconPosition: "left",
};

const sendButtonConfigWithoutText: ButtonConfig = {
  text: "",
  icon: <ReceiveIcon flipped={true} />,
  href: "/send/transfer",
  variant: "secondary",
};

const sendButtonConfig: ButtonConfig = {
  ...sendButtonConfigWithoutText,
  text: browser.i18n.getMessage("send"),
  icon: undefined,
  variant: "primary",
};

const receiveButtonConfig: ButtonConfig = {
  text: browser.i18n.getMessage("receive"),
  href: "/receive",
  icon: undefined,
  variant: "primary",
};

const corePermawebTokenIds = [AR_PROCESS_ID, PI_PROCESS_ID, AO_PROCESS_ID];
const liquidopsActiveTokenIds = Object.values(tokenData)
  .filter((token) => !token.deprecated)
  .map((agent) => agent.address);
const aoAgentTokenIds = [AO_PROCESS_ID, WUSDC_PROCESS_ID, WAR_PROCESS_ID];
const agentTokenIds = new Set([...liquidopsActiveTokenIds, ...aoAgentTokenIds]);

export const TokenActionButtons = ({ id }: TokenActionButtonsProps) => {
  const { data: fairLaunchTokens = [] } = useFairLaunchTokens();
  const earnTokenIds = useMemo(
    () => new Set([...corePermawebTokenIds, ...fairLaunchTokens.map((token) => token.processId)]),
    [fairLaunchTokens],
  );

  const buttons = useMemo<ButtonConfig[]>(() => {
    if (id === "AR") {
      return [purchaseButtonConfig, earnButtonConfigWithoutText, agentsButtonConfigWithoutText];
    } else if (id === AO_PROCESS_ID) {
      return [earnButtonConfig, sendButtonConfigWithoutText, agentsButtonConfigWithoutText];
    } else if (earnTokenIds.has(id) && agentTokenIds.has(id)) {
      return [earnButtonConfig, sendButtonConfigWithoutText, agentsButtonConfigWithoutText];
    } else if (earnTokenIds.has(id) && !agentTokenIds.has(id)) {
      return [earnButtonConfig, sendButtonConfig];
    } else if (agentTokenIds.has(id) && !earnTokenIds.has(id)) {
      return [agentsButtonConfig, sendButtonConfig];
    } else {
      return [sendButtonConfig, receiveButtonConfig];
    }
  }, [id, earnTokenIds]);

  return <ActionButtons buttons={buttons} />;
};
