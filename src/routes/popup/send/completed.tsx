import { AnimatePresence, type Variants, motion } from "framer-motion";
import { Button, Section, Text } from "@arconnect/components-rebrand";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import styled from "styled-components";
import type {
  WanderRoutePath,
  CommonRouteProps
} from "~wallets/router/router.types";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import Lottie from "react-lottie";
import checkmarkAnimationData from "assets/lotties/checkmark.json";

export interface TransactionCompletedParams {
  id: string;
}

export type TransactionCompletedViewProps =
  CommonRouteProps<TransactionCompletedParams>;

export function TransactionCompletedView({
  params: { id }
}: TransactionCompletedViewProps) {
  const { navigate } = useLocation();
  const { back: backPath, isAo } = useSearchParams<{
    back?: string;
    isAo: boolean;
  }>();

  function handleOpen() {
    const url = isAo
      ? `https://www.ao.link/#/message/${id}`
      : `https://viewblock.io/arweave/tx/${id}`;

    browser.tabs.create({ url });
  }

  function handleDone() {
    navigate((backPath as WanderRoutePath) || "/");
  }

  if (!id) return null;

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
                preserveAspectRatio: "xMidYMid slice"
              }
            }}
            height={200}
            width={200}
          />
          <TextContainer>
            <Title>{browser.i18n.getMessage("transaction_complete")}</Title>
            <SubTitle>
              {browser.i18n.getMessage("transaction_id")}: {id}
            </SubTitle>
            <LinkText
              onClick={() =>
                navigate(
                  `/transaction/${id}${
                    backPath ? `?back=${encodeURIComponent(backPath)}` : ""
                  }&fromSend=true` as WanderRoutePath
                )
              }
            >
              {browser.i18n.getMessage("view_transaction_details")}
            </LinkText>
          </TextContainer>
        </BodyWrapper>
      </MainWrapper>
      <AnimatePresence>
        {id && (
          <motion.div
            variants={opacityAnimation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <Section style={{ gap: 12 }}>
              <Button fullWidth onClick={handleDone}>
                {browser.i18n.getMessage("done")}
              </Button>
              <Button variant="secondary" fullWidth onClick={handleOpen}>
                {isAo ? "AOLink" : "Viewblock"}
                <LinkExternal02 style={{ marginLeft: "8px" }} />
              </Button>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const BodyWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 18px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  max-width: 90%;
`;

const Title = styled(Text).attrs({
  noMargin: true,
  weight: "bold"
})`
  font-size: 22px;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const SubTitle = styled(Text).attrs({
  noMargin: true,
  variant: "secondary",
  size: "sm"
})`
  display: flex;
  flex-wrap: wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: center;
`;

const LinkText = styled(Text).attrs({
  noMargin: true,
  weight: "medium"
})`
  color: ${(props) => props.theme.input.icons.searchActive};
  cursor: pointer;
`;
