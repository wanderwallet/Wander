import { Section, Text } from "@wanderapp/components";
import { CopyIcon } from "@iconicicons/react";
import { QRCodeSVG } from "qrcode.react";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import { useEffect, useState, useMemo } from "react";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { useActiveWallet } from "~wallets/hooks";
import { CopyToClipboard } from "~components/CopyToClipboard";
import { QRCodeWrapper } from "~components/QRCodeWrapper";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useHasArnsNames, useIsArNSPurchaseGated } from "~lib/arns";
import { ExtensionStorage } from "~utils/storage";

interface ReceiveViewProps extends CommonRouteProps {
  walletName?: string;
  walletAddress?: string;
}

export function ReceiveView({ walletName, walletAddress }: ReceiveViewProps) {
  const { navigate } = useLocation();
  const theme = useTheme();

  const isArnsGated = useIsArNSPurchaseGated();

  const wallet = useActiveWallet();

  const [copied, setCopied] = useState(false);

  const effectiveAddress = useMemo(() => walletAddress || wallet?.address, [walletAddress, wallet]);

  const effectiveWalletName = useMemo(() => walletName || wallet?.nickname, [walletName, wallet]);

  const hasArnsNames = useHasArnsNames();

  //segment
  useEffect(() => {
    if (!walletName && !walletAddress) {
      trackPage(PageType.RECEIVE);
    }
  }, []);

  return (
    <Wrapper>
      <HeadV2
        title={browser.i18n.getMessage("receive")}
        back={() => {
          if (walletName && walletAddress) {
            navigate(`/quick-settings/wallets/${walletAddress}`);
          } else {
            navigate("/");
          }
        }}
      />

      <ContentWrapper>
        <Section
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 24,
            gap: 32,
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}>
          <div>
            <Text size="lg" weight="semibold" style={{ wordBreak: "break-all", textAlign: "center" }} noMargin>
              {effectiveWalletName}
            </Text>
            {!hasArnsNames && (
              <button
                style={{
                  color: theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9",
                  cursor: "pointer",
                  paddingTop: ".5rem",
                  margin: 0,
                  fontSize: "1rem",
                }}
                onClick={async () => {
                  if (isArnsGated) {
                    navigate(PopupPaths.Wallet, { params: { address: effectiveAddress } });
                  } else {
                    const isShown = await ExtensionStorage.get<boolean>("arns_purchase_start_shown");
                    const path = isShown ? PopupPaths.ArNSPurchaseNameSearch : PopupPaths.ArNSPurchaseStart;
                    navigate(path);
                  }
                }}>
                {browser.i18n.getMessage("get_your_arns_name")}
              </button>
            )}
          </div>
          <QRCodeWrapper>
            <QRCodeSVG fgColor="#fff" bgColor="transparent" size={176} value={effectiveAddress ?? ""} />
          </QRCodeWrapper>
          <AddressField>
            <Text size="sm" weight="medium" noMargin>
              {effectiveAddress}
            </Text>

            <CopyToClipboard
              onCopy={setCopied}
              showToast={false}
              label={browser.i18n.getMessage(copied ? "copied" : "copy")}
              labelAs={({ children }) => (
                <Text variant="secondary" size="sm" weight="semibold" noMargin>
                  {children}
                </Text>
              )}
              text={effectiveAddress}
            />
          </AddressField>
        </Section>
      </ContentWrapper>
    </Wrapper>
  );
}

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 72px);
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
`;

export const AddressField = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 500;
  width: 100%;
  padding: 12px;
  flex-direction: column;
  gap: 12px;
  background: ${(props) => props.theme.surfaceTertiary};
  border-radius: 8px;
  word-break: break-word;
  flex-wrap: wrap;
  box-sizing: border-box;
`;

export const CopyAction = styled(CopyIcon)`
  font-size: 1.25rem;
  width: 1em;
  height: 1em;
  color: #fff;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
  }
`;
