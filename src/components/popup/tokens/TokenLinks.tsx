import React from "react";
import { useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { CopyToClipboard } from "~components/CopyToClipboard";
import { getKnownTokenInfo } from "~tokens/knownTokens";
import { formatAddress } from "~utils/format";
import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { ArrowUpRight } from "@untitled-ui/icons-react";
import styled from "styled-components";

interface TokenLinksProps {
  id: string;
}

export const TokenLinks: React.FC<TokenLinksProps> = ({ id }) => {
  const theme = useTheme();
  const tokenInfo = getKnownTokenInfo(id);

  const viewblockUrl = id === "AR" ? "https://viewblock.io/arweave" : null;

  const aoLinkUrl = id !== "AR" ? `https://www.ao.link/#/token/${id}` : null;

  const handleLinkPress = async (url: string) => {
    browser.tabs.create({ url });
  };

  return (
    <Flex direction="column" gap={8}>
      <Text variant="secondary" weight="medium" noMargin>
        {browser.i18n.getMessage("info")}
      </Text>
      {tokenInfo?.website && (
        <LinkButton onClick={() => handleLinkPress(tokenInfo.website!)}>
          <Text weight="medium" noMargin>
            {browser.i18n.getMessage("website")}
          </Text>
          <ArrowUpRight style={{ width: "20px", height: "20px" }} />
        </LinkButton>
      )}
      {aoLinkUrl && (
        <LinkButton onClick={() => handleLinkPress(aoLinkUrl)}>
          <Text weight="medium" noMargin>
            AO Link
          </Text>
          <ArrowUpRight style={{ width: "20px", height: "20px" }} />
        </LinkButton>
      )}
      {viewblockUrl && (
        <LinkButton onClick={() => handleLinkPress(viewblockUrl)}>
          <Text weight="medium" noMargin>
            Viewblock
          </Text>
          <ArrowUpRight style={{ width: "20px", height: "20px" }} />
        </LinkButton>
      )}
      {id !== "AR" && (
        <Flex direction="row" align="center" gap={4}>
          <Text weight="medium" noMargin>
            {browser.i18n.getMessage("address")}:
          </Text>
          <CopyToClipboard
            text={id}
            label={formatAddress(id, 4)}
            labelStyle={{
              color: theme.secondaryText,
              fontSize: "16px",
              fontWeight: 500,
            }}
          />
        </Flex>
      )}
    </Flex>
  );
};

const LinkButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;

  &:hover {
    opacity: 0.8;
  }
`;
