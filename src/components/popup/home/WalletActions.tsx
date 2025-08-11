import { ActionButtons, type ButtonConfig } from "../ActionButtons";
import browser from "webextension-polyfill";
import { ReceiveIcon } from "~components/icons/ReceiveIcon";
import { SwapIcon } from "~routes/popup/swap/components/SwapIcon";

import arLogoDark from "url:/assets/ar/ar-logo-dark.svg";

const buttons: ButtonConfig[] = [
  {
    text: browser.i18n.getMessage("buy_ar_button"),
    icon: <img src={arLogoDark} style={{ height: 18.5, width: 18.5 }} alt="Buy AR" />,
    href: "/purchase",
    variant: "primary",
    iconPosition: "right",
  },
  {
    text: "",
    icon: <ReceiveIcon flipped={true} />,
    href: "/send/transfer",
    variant: "secondary",
  },
  {
    text: "",
    icon: <SwapIcon />,
    href: "/swap",
    variant: "secondary",
  },
];

export default function WalletActions() {
  return <ActionButtons buttons={buttons} />;
}
