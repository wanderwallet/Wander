import { ButtonV2, Section, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import noBalanceArt from "url:/assets/ar/no_funds.png";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { PureBuyButton } from "./BuyButton";
import { useLocation } from "~wallets/router/router.utils";

export default function NoBalance() {
  const { navigate } = useLocation();

  return (
    <Wrapper>
      <Art src={noBalanceArt} />
      <NoBalanceText>{browser.i18n.getMessage("home_no_balance", "$AR")}</NoBalanceText>
      <ButtonWrapper>
        <PureBuyButton />
        <ButtonV2 onClick={() => navigate("/tokens")} secondary fullWidth className="normal-font-weight">
          {browser.i18n.getMessage("view_all_assets")}
          <ArrowRight style={{ marginLeft: "5px" }} />
        </ButtonV2>
      </ButtonWrapper>
    </Wrapper>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const NoBalanceText = styled(Text).attrs({
  heading: true,
  noMargin: true,
})`
  margin-bottom: 0.75rem;
`;

const Art = styled.img.attrs({
  draggable: false,
  alt: "No balance art",
})`
  user-select: none;
  width: 137px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const ArrowRight = styled(ArrowRightIcon)`
  width: 16px;
  height: 16px;
`;
