import { ActionButtons, type ButtonConfig } from "../ActionButtons";
import browser from "webextension-polyfill";
import { ReceiveIcon } from "~components/icons/ReceiveIcon";
import { SwapIcon } from "~routes/popup/swap/components/SwapIcon";
import { useActiveTier } from "~utils/tier/hooks";
import { useMemo, useState } from "react";
import { tierNameToId, TierTypes } from "~utils/tier/constants";
import styled, { useTheme } from "styled-components";
import { WanderIcon } from "../tier/WanderIcon";
import { SwapGatingPopup } from "~routes/popup/swap/components/SwapGatingPopup";
import { SWAP_DISABLED_FOR_LOWER_TIERS } from "~routes/popup/swap/utils/swap.constants";

import arLogoDark from "url:/assets/ar/ar-logo-dark.svg";

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

const reserveTierId = tierNameToId[TierTypes.Reserve];

export default function WalletActions() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: activeTier } = useActiveTier();

  const buttons: ButtonConfig[] = useMemo(() => {
    const tierId = tierNameToId[activeTier?.tier || TierTypes.Core];
    const disabled = tierId > reserveTierId && SWAP_DISABLED_FOR_LOWER_TIERS;

    const swapButtonConfig: ButtonConfig = {
      text: "",
      icon: <SwapIcon />,
      href: "/swap",
      variant: "secondary",
      disabled,
      disabledTag: <DisabledTag onClick={() => setIsOpen((prev) => !prev)} />,
    };

    return [purchaseButtonConfig, sendButtonConfig, swapButtonConfig];
  }, [activeTier?.tier]);

  return (
    <>
      <ActionButtons buttons={buttons} />
      <SwapGatingPopup isOpen={isOpen} setOpen={setIsOpen} />
    </>
  );
}

interface DisabledTagProps {
  onClick: () => void;
}

function DisabledTag({ onClick }: DisabledTagProps) {
  const theme = useTheme();

  return (
    <SwapDisabledTagWrapper onClick={onClick}>
      <LockIcon size={8.25} color={theme.displayTheme === "light" ? "#111" : "#EEE"} />
      <WanderIcon tier={TierTypes.Reserve} height={6.381} width={13.614} />
    </SwapDisabledTagWrapper>
  );
}

function LockIcon({ size = 8, color = "#EEEEEE" }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
      style={{ flexShrink: 0 }}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.99292 0.5625C2.85383 0.5625 1.93042 1.48591 1.93042 2.625V3.36417C1.83327 3.38546 1.74003 3.41646 1.64993 3.46237C1.39121 3.59419 1.18086 3.80454 1.04904 4.06326C0.96403 4.2301 0.930149 4.40771 0.914362 4.60094C0.899162 4.78697 0.899166 5.01534 0.89917 5.29205V5.45795C0.899166 5.73465 0.899162 5.96303 0.914362 6.14907C0.930149 6.34229 0.96403 6.5199 1.04904 6.68674C1.18086 6.94546 1.39121 7.15581 1.64993 7.28763C1.81677 7.37264 1.99438 7.40652 2.18761 7.42231C2.37364 7.43751 2.60202 7.43751 2.87873 7.4375H5.10711C5.38382 7.43751 5.6122 7.43751 5.79824 7.42231C5.99146 7.40652 6.16907 7.37264 6.33591 7.28763C6.59463 7.15581 6.80498 6.94546 6.9368 6.68674C7.02181 6.5199 7.05569 6.34229 7.07148 6.14907C7.08668 5.96303 7.08667 5.73466 7.08667 5.45796V5.29205C7.08667 5.01534 7.08668 4.78697 7.07148 4.60094C7.05569 4.40771 7.02181 4.2301 6.9368 4.06326C6.80498 3.80454 6.59463 3.59419 6.33591 3.46237C6.24581 3.41646 6.15257 3.38546 6.05542 3.36417V2.625C6.05542 1.48591 5.13201 0.5625 3.99292 0.5625ZM5.36792 3.31306V2.625C5.36792 1.86561 4.75231 1.25 3.99292 1.25C3.23353 1.25 2.61792 1.86561 2.61792 2.625V3.31306C2.69963 3.3125 2.78649 3.3125 2.87872 3.3125H5.10712C5.19935 3.3125 5.28621 3.3125 5.36792 3.31306Z"
        fill={color}
      />
    </svg>
  );
}

const SwapDisabledTagWrapper = styled.div`
  display: flex;
  width: 36px;
  height: 22px;
  padding: 4.4px;
  justify-content: space-between;
  align-items: center;
  gap: 4.4px;
  flex-shrink: 0;
  border-radius: 8.8px;
  border: 1.1px solid ${({ theme }) => (theme.displayTheme === "light" ? "#87a38c" : "#87a38c")};
  background: ${({ theme }) =>
    theme.displayTheme === "light"
      ? "linear-gradient(180deg, #E6E0F4 0%, #F5F5F5 23.74%)"
      : "linear-gradient(180deg, #26126f 0%, #111 23.74%)"};
  cursor: pointer;
  box-shadow: ${({ theme }) =>
    theme.displayTheme === "light"
      ? `
      inset 0 1.1px 5.5px rgba(134, 229, 169, 0.3),
      inset 0 1.1px 1.98px rgba(0, 0, 0, 0.1),
      inset 0 63.23px 50.58px rgba(134, 229, 169, 0.03),
      inset 0 2.87px 12.93px rgba(8, 59, 88, 0.1),
      inset 0 0.72px 14.37px rgba(90, 93, 94, 0.1)
    `
      : `
      inset 0 1.1px 5.5px rgba(134, 229, 169, 0.6),
      inset 0 1.1px 1.98px rgba(255, 255, 255, 0.6),
      inset 0 63.23px 50.58px rgba(134, 229, 169, 0.03),
      inset 0 2.87px 12.93px rgba(8, 59, 88, 0.3),
      inset 0 0.72px 14.37px rgba(90, 93, 94, 0.2)
    `};
  backdrop-filter: blur(8.3px);
  box-sizing: border-box;

  &:hover {
    opacity: 0.8;
  }
`;
