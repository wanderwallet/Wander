import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import HeadV2 from "~components/popup/HeadV2";
import { useParams } from "wouter";
import { useAoToken } from "~tokens/hooks";
import { Flex } from "~components/common/Flex";
import { Logo } from "~components/popup/Token";
import { useEffect, useState } from "react";
import { getUserAvatar } from "~lib/avatar";
import { TokenInfo } from "~components/popup/tokens/TokenInfo";
import { TokenLinks } from "~components/popup/tokens/TokenLinks";
import { TokenActivity } from "~components/popup/tokens/TokenActivity";

export function TokenDetailView() {
  const { id } = useParams<{ id: string }>();
  const token = useAoToken(id);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!token?.Logo) return;
      if (token.Logo) {
        const logo = await getUserAvatar(token.Logo);
        setLogo(logo);
      }
    };
    fetchLogo();
  }, [token?.Logo]);

  if (!token) return null;

  return (
    <>
      <HeadV2
        title={
          <Flex align="center" gap={8}>
            <Logo src={logo} alt={token.Name} height={24} width={24} />
            <Text size="lg" weight="bold" noMargin>
              {token.Name}
            </Text>
          </Flex>
        }
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
