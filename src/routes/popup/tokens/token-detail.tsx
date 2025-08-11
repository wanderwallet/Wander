import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import HeadV2 from "~components/popup/HeadV2";
import { useParams } from "wouter";
import { useAoToken } from "~tokens/hooks";
import { Flex } from "~components/common/Flex";
import { TokenInfo } from "~components/popup/tokens/TokenInfo";
import { TokenLinks } from "~components/popup/tokens/TokenLinks";
import { TokenActivity } from "~components/popup/tokens/TokenActivity";
import { useLocation } from "~wallets/router/router.utils";
import { TokenLogo } from "~components/popup/TokenLogo";

export function TokenDetailView() {
  const { navigate } = useLocation();
  const { id } = useParams<{ id: string }>();
  const token = useAoToken(id);

  if (!token) return null;

  return (
    <>
      <HeadV2
        title={
          <Flex align="center" gap={8}>
            <TokenLogo token={token} size={24} />
            <Text size="lg" weight="bold" noMargin>
              {token?.Name?.length <= 15 ? token.Name : token.Ticker}
            </Text>
          </Flex>
        }
        back={() => navigate("/")}
      />

      <Wrapper>
        <Flex direction="column" gap={24}>
          <TokenInfo id={id} />
          <TokenLinks id={id} />
          <TokenActivity id={id} />
        </Flex>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
`;
