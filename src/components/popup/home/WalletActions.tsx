import { ActionButtons, type ButtonConfig } from "../ActionButtons";
import browser from "webextension-polyfill";
import { ReceiveIcon } from "~components/icons/ReceiveIcon";
import { SwapIcon } from "~routes/popup/swap/components/SwapIcon";
import { useMemo, useState } from "react";
import { SwapGatingPopup } from "~routes/popup/swap/components/SwapGatingPopup";
import { useIsSwapGated } from "~routes/popup/swap/utils/swap.hooks";
import { TierGatedTag } from "../tier/TierGatedTag";

import arLogoDark from "url:/assets/ar/ar-logo-dark.svg";
import { MaintenanceTag } from "./MaintenanceTag";

const purchaseButtonConfig: ButtonConfig = {
  text: browser.i18n.getMessage("buy_ar_button"),
  icon: <img src={arLogoDark} style={{ height: 18.5, width: 18.5 }} alt="Buy AR" />,
  href: "/purchase",
  variant: "primary",
  iconPosition: "right",
};

const sendButtonConfig: ButtonConfig = {
  text: "",
  icon: <ReceiveIcon flipped={true} />,
  href: "/send/transfer",
  variant: "secondary",
};

export default function WalletActions() {
  const [isOpen, setIsOpen] = useState(false);
  const isSwapGated = useIsSwapGated();

  const buttons: ButtonConfig[] = useMemo(() => {
    const swapButtonConfig: ButtonConfig = {
      text: "",
      icon: <SwapIcon />,
      href: "/swap",
      variant: "secondary",
      // TODO: Remove this when swap is re-enabled
      disabled: true,
      disabledTag: <MaintenanceTag onClick={() => {}} />,
      // disabled: isSwapGated,
      // disabledTag: <TierGatedTag onClick={() => setIsOpen((prev) => !prev)} />,
    };

    return [purchaseButtonConfig, sendButtonConfig, swapButtonConfig];
  }, [isSwapGated]);

  return (
    <>
      <ActionButtons buttons={buttons} />
      <SwapGatingPopup isOpen={isOpen} setOpen={setIsOpen} />
    </>
  );
}
