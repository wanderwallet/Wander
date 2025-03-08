import { Section, Text } from "@arconnect/components-rebrand";
import { CopyIcon } from "@iconicicons/react";
import { QRCodeSVG } from "qrcode.react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useEffect, useState, useMemo } from "react";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { useActiveWallet } from "~wallets/hooks";
import { CopyToClipboard } from "~components/CopyToClipboard";

interface ReceiveViewProps extends CommonRouteProps {
  walletName?: string;
  walletAddress?: string;
}

export function ReceiveView({ walletName, walletAddress }: ReceiveViewProps) {
  const { navigate } = useLocation();

  const wallet = useActiveWallet();

  const [copied, setCopied] = useState(false);

  const effectiveAddress = useMemo(
    () => walletAddress || wallet?.address,
    [walletAddress, wallet]
  );

  const effectiveWalletName = useMemo(
    () => walletName || wallet?.nickname,
    [walletName, wallet]
  );

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
            flex: 1
          }}
        >
          <Text size="lg" weight="semibold" noMargin>
            {effectiveWalletName}
          </Text>
          <QRCodeWrapper>
            <QRCodeSVG
              fgColor="#fff"
              bgColor="transparent"
              size={176}
              value={effectiveAddress ?? ""}
            />
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

export const QRCodeWrapper = styled.div<{ size?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
  border-radius: 24px;
  padding: 16px;
  width: ${(props) => props.size ?? 176}px;
  height: ${(props) => props.size ?? 176}px;
`;
