import { useEffect } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useTheme } from "~utils/theme";
import { ButtonV2, Section } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";
import { PageType, trackPage } from "~utils/analytics";
import { useStorage } from "~utils/storage";
import type { Quote } from "~lib/onramper";
import { useLocation } from "~wallets/router/router.utils";

export function PendingPurchaseView() {
  const theme = useTheme();
  const { navigate } = useLocation();

  const [quote] = useStorage<Quote>({
    key: "transak_quote",
    instance: ExtensionStorage
  });

  //segment
  useEffect(() => {
    trackPage(PageType.TRANSAK_PURCHASE_PENDING);
  }, []);

  return (
    <Wrapper>
      <MainContent>
        <CheckGraphic>
          <CheckIcon />
        </CheckGraphic>
        <CongratsTitle>
          {browser.i18n.getMessage("congrats_purchase_pending")}
        </CongratsTitle>
        <PurchasePendingText displayTheme={theme}>
          {browser.i18n.getMessage("info_purchase_pending")}
        </PurchasePendingText>
        {quote && (
          <OrderID displayTheme={theme}>
            {browser.i18n.getMessage("order_id_purchase_pending")}{" "}
            {quote.quoteId}
          </OrderID>
        )}
      </MainContent>
      <Section>
        <ButtonV2 fullWidth onClick={() => navigate("/")}>
          Close
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const CheckIcon = () => (
  <svg
    width="46.67px"
    height="33.33px"
    viewBox="0 0 11 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.67794 6.31171L1.30728 3.82401L0.5 4.66517L3.67794 8L10.5 0.841163L9.69841 0L3.67794 6.31171Z"
      fill="white"
    />
  </svg>
);

const CheckGraphic = styled.div`
  border-radius: 100%;
  height: 100px;
  width: 100px;
  background-color: #14d1104d;
  outline: 6.67px solid #14d110;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  padding-left: 3px;
`;

const OrderID = styled.div<{ displayTheme: DisplayTheme }>`
  text-align: center;
  font-size: 12px;
  font-weight: 100;
  color: ${(props) => (props.displayTheme === "light" ? "#000000" : "#ffffff")};
`;

const PurchasePendingText = styled.div<{ displayTheme: DisplayTheme }>`
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  color: ${(props) => (props.displayTheme === "light" ? "#000000" : "#ffffff")};
  margin-bottom: 17px;
  padding: 0px 20px 0px 20px;
`;

const CongratsTitle = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: #ab9aff;
  margin-bottom: 17px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: flex-end;
  gap: 40px;
`;

const MainContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0px 37px 4.8px 37px;
`;
