import { useEffect } from "react";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { ButtonV2, Text } from "@arconnect/components";
import { type Quote } from "~lib/onramper";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";
import { Line } from "./purchase";
import { useStorage } from "~utils/storage";
import { formatAddress } from "~utils/format";
import type { CommonRouteProps } from "~wallets/router/router.types";

export interface ConfirmPurchaseViewParams {
  quoteId: string;
}

export type ConfirmPurchaseViewProps =
  CommonRouteProps<ConfirmPurchaseViewParams>;

export function ConfirmPurchaseView({
  params: { quoteId: id }
}: ConfirmPurchaseViewProps) {
  const { navigate } = useLocation();

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [quote] = useStorage<Quote>({
    key: "transak_quote",
    instance: ExtensionStorage
  });

  //segment
  useEffect(() => {
    trackPage(PageType.TRANSAK_CONFIRM_PURCHASE);
  }, []);

  const buyAR = async () => {
    try {
      const baseUrl = "https://global.transak.com/";
      const params = new URLSearchParams({
        apiKey: process.env.PLASMO_PUBLIC_TRANSAK_API_KEY,
        defaultCryptoCurrency: "AR",
        defaultFiatAmount: (quote.fiatAmount + quote.totalFee).toString(),
        defaultFiatCurrency: quote.fiatCurrency,
        walletAddress: activeAddress,
        defaultPaymentMethod: quote.paymentMethod
      });
      const url = `${baseUrl}?${params.toString()}`;
      browser.tabs.create({
        url: url
      });
      navigate("/purchase-pending");
    } catch (error) {
      console.error("Error buying AR:", error);
    }
  };

  return (
    <Wrapper>
      <HeadV2 title="Review purchase" />
      <Body>
        {quote && (
          <Upper>
            <div>
              <CustomText noMargin>Wallet Address</CustomText>
              <CustomText alternate={true} noMargin>
                {activeAddress && formatAddress(activeAddress, 10)}
              </CustomText>
            </div>
            <div>
              <CustomText noMargin>Order Details</CustomText>
              <Line margin="8px" />
              <Section>
                <CustomText noMargin fontSize="14px">
                  Rate
                </CustomText>
                <CustomText noMargin fontSize="14px">
                  {quote.cryptoAmount} AR = {quote.fiatAmount}{" "}
                  {quote.fiatCurrency}
                </CustomText>
              </Section>
              <Line margin="8px" />
              <Section>
                <CustomText noMargin fontSize="14px">
                  Network Fee
                </CustomText>
                <CustomText noMargin fontSize="14px">
                  {
                    quote.feeBreakdown.find((fee) => fee.id === "network_fee")
                      .value
                  }{" "}
                  {quote.fiatCurrency}
                </CustomText>
              </Section>
              <Line margin="8px" />
              <Section>
                <CustomText noMargin fontSize="14px">
                  Vendor fee
                </CustomText>
                <CustomText noMargin fontSize="14px">
                  {
                    quote.feeBreakdown.find((fee) => fee.id === "transak_fee")
                      .value
                  }{" "}
                  {quote.fiatCurrency}
                </CustomText>
              </Section>
              <Line margin="8px" />
              <Section>
                <CustomText noMargin>Total</CustomText>
                <CustomText noMargin>
                  {quote.fiatAmount + quote.totalFee} {quote.fiatCurrency}
                </CustomText>
              </Section>
            </div>
          </Upper>
        )}
        <ButtonV2 onClick={buyAR} fullWidth>
          Buy AR
        </ButtonV2>
      </Body>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: space-between;
`;

const Upper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Body = styled.div`
  height: 100%;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  padding: 0 15px 15px 15px;
`;

const Section = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const CustomText = styled(Text)<{ alternate?: boolean; fontSize?: string }>`
  color: ${(props) =>
    props.alternate ? props.theme.secondaryTextv2 : props.theme.primaryTextv2};
  font-size: ${(props) => props.fontSize && props.fontSize};
`;
