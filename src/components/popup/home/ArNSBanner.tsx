import type { DisplayTheme } from "@arconnect/components";
import { CloseIcon } from "@iconicicons/react";
import { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import { ArioIcon } from "~components/embed";
import { isArNSNameProfile } from "~lib/arns";
import { useNameServiceProfile } from "~lib/nameservice";
import { ExtensionStorage } from "~utils/storage";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

interface ArNSBannerProps {
  activeAddress: string;
}

export default function ArNSBanner({ activeAddress }: ArNSBannerProps) {
  const theme = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const { navigate } = useLocation();

  const nameServiceProfile = useNameServiceProfile(activeAddress);

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
          if (!hideBanner) {
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
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
      <h4>
        Get your ArNS Name! <a onClick={handleRegisterClick}>Register Now</a>
      </h4>
      <Close onClick={hideBanner} />
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
  color: #ffffff;
  overflow: hidden;
  background: rgba(42, 34, 96, 1);
  justify-content: center;
  align-items: center;
  gap: 8px;
  h4 {
    font-weight: 500;
    font-size: 0.8rem !important;
    margin: 0;
    padding: 0;
    font-size: inherit;
  }
`;

const Close = styled(CloseIcon)`
  z-index: 1;
  font-size: 1.3rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.95) translateY(-50%);
  }
`;
