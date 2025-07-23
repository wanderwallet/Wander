import { ActionButtons, type ButtonConfig } from "../ActionButtons";
import { QrCode02 } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { ReceiveIcon } from "~components/icons/ReceiveIcon";

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
    icon: <QrCode02 style={{ height: 26, width: 26 }} />,
    href: "/receive",
    variant: "secondary",
  },
];

export default function WalletActions() {
  return <ActionButtons buttons={buttons} />;
}
