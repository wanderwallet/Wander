import { Button, Text } from "@arconnect/components-rebrand";
import { useLocation } from "~wallets/router/router.utils";
import styled from "styled-components";
import Lottie from "react-lottie";
import checkmarkAnimationData from "assets/lotties/checkmark.json";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { Flex } from "~components/common/Flex";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { trackPage, PageType } from "~utils/analytics";

export function AllocationSetView() {
  const { navigate, back } = useLocation();

  useEffect(() => {
    trackPage(PageType.EARN_ALLOCATION_SET);
  }, []);

  return (
    <Wrapper>
      <MainWrapper>
        <BodyWrapper>
          <Lottie
            options={{
              loop: false,
              autoplay: true,
              animationData: checkmarkAnimationData,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid slice",
              },
            }}
            height={200}
            width={200}
          />
          <TextContainer>
            <Title>{browser.i18n.getMessage("allocation_set")}</Title>
            <SubTitle>{browser.i18n.getMessage("allocation_set_description")}</SubTitle>
          </TextContainer>
        </BodyWrapper>
      </MainWrapper>
      <Flex direction="column" gap={12}>
        <Button fullWidth onClick={() => back()}>
          {browser.i18n.getMessage("view_delegation_list")}
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate(PopupPaths.Home)}>
          {browser.i18n.getMessage("go_to_dashboard")}
        </Button>
      </Flex>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  min-height: calc(100vh - 48px);
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;

  flex: 1;
`;

const BodyWrapper = styled.div`
  display: flex;
  flex: 1;
  gap: 16px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
`;

const Title = styled(Text).attrs({
  noMargin: true,
  weight: "bold",
})`
  font-size: 22px;
`;

const SubTitle = styled(Text).attrs({
  noMargin: true,
  variant: "secondary",
})`
  display: flex;
  flex-wrap: wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: center;
`;
