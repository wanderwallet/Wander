import { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import { ArioIcon } from "~components/embed";
import { isArNSNameProfile, useHasArnsNames, useIsArNSPurchaseGated } from "~lib/arns";
import { useNameServiceProfile } from "~lib/nameservice";
import { ExtensionStorage } from "~utils/storage";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import browser from "webextension-polyfill";
import { type DisplayTheme, Text } from "@wanderapp/components";
import { ExitButton } from "~components/ExitButton";
import { EventType, trackEvent } from "~utils/analytics";

interface ArNSBannerProps {
  activeAddress: string;
}

export default function ArNSBanner({ activeAddress }: ArNSBannerProps) {
  const theme = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const { navigate } = useLocation();
  const isArnsGated = useIsArNSPurchaseGated();
  const hasArnsNames = useHasArnsNames();

  const { data: nameServiceProfile } = useNameServiceProfile(activeAddress);

  const handleRegisterClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isArnsGated) {
      navigate(PopupPaths.Wallet, { params: { address: activeAddress } });
    } else {
      const isShown = await ExtensionStorage.get<boolean>("arns_purchase_start_shown");
      const path = isShown ? PopupPaths.ArNSPurchaseNameSearch : PopupPaths.ArNSPurchaseStart;
      navigate(path);
    }
  };

  async function hideBanner() {
    setShowBanner(false);
    await ExtensionStorage.set(`arns_hide_banner_${activeAddress}`, true);
  }

  useEffect(() => {
    if (activeAddress) {
      if (isArNSNameProfile(nameServiceProfile)) {
        setShowBanner(false);
      } else {
        ExtensionStorage.get(`arns_hide_banner_${activeAddress}`).then((hideBanner) => {
          setShowBanner(!hideBanner);
        });
      }
    }
  }, [activeAddress, nameServiceProfile]);

  if (!activeAddress || !showBanner || hasArnsNames) return null;

  return (
    <Banner displayTheme={theme.displayTheme} show={showBanner}>
      <ArioIcon width="24px" height="24px" />
      <Text style={{ display: "flex", alignItems: "center", gap: "8px" }} weight="medium" noMargin>
        {browser.i18n.getMessage("get_your_arns_name")}!{" "}
        <a style={{ fontWeight: 600 }} onClick={handleRegisterClick}>
          {browser.i18n.getMessage("register_now")}
        </a>
      </Text>
      <ExitButton color={theme.input.placeholder.default} style={{ height: 24, width: 24 }} onClick={hideBanner} />
    </Banner>
  );
}

const Banner = styled.div<{ displayTheme: DisplayTheme; show: boolean }>`
  a {
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  display: flex;
  padding: 0.75rem;
  position: relative;
  flex-direction: row;
  overflow: hidden;
  background: ${({ displayTheme }) => (displayTheme === "dark" ? "rgba(42, 34, 96, 1)" : "#E3E1FA")};
  justify-content: center;
  align-items: center;
  gap: 8px;
`;
