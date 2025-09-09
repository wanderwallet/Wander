import { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import { ArioIcon } from "~components/embed";
import { isArNSNameProfile } from "~lib/arns";
import { useNameServiceProfile } from "~lib/nameservice";
import { ExtensionStorage } from "~utils/storage";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import browser from "webextension-polyfill";
import { type DisplayTheme, Text } from "@arconnect/components-rebrand";
import { ExitButton } from "~components/ExitButton";

interface ArNSBannerProps {
  activeAddress: string;
}

export default function ArNSBanner({ activeAddress }: ArNSBannerProps) {
  const theme = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const { navigate } = useLocation();

  const { data: nameServiceProfile } = useNameServiceProfile(activeAddress);

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(PopupPaths.ArNSPurchaseStart);
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

  if (!activeAddress || !showBanner) {
    return null;
  }

  return (
    <Banner displayTheme={theme.displayTheme} show={showBanner}>
      <ArioIcon width="24px" height="24px" />
      <Text style={{ display: "flex", alignItems: "center", gap: "8px" }} weight="medium" noMargin>
        {browser.i18n.getMessage("get_your_arns_name")}!{" "}
        <a style={{ fontWeight: 600 }} onClick={handleRegisterClick}>
          {browser.i18n.getMessage("register_now")}
        </a>
      </Text>
      <ExitButton style={{ height: 24, width: 24 }} onClick={hideBanner} />
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
