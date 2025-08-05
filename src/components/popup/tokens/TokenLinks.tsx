import React, { useMemo } from "react";
import { useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { CopyToClipboard } from "~components/CopyToClipboard";
import { getKnownTokenInfo } from "~tokens/knownTokens";
import { formatAddress } from "~utils/format";
import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { ArrowUpRight } from "@untitled-ui/icons-react";
import styled from "styled-components";
import { TwitterIcon } from "~components/icons/TwitterIcon";
import { GithubIcon } from "~components/icons/GithubIcon";
import discordLogo from "url:/assets/setup/discord-logo.svg";

interface TokenLinksProps {
  id: string;
}

export const TokenLinks: React.FC<TokenLinksProps> = ({ id }) => {
  const theme = useTheme();
  const tokenInfo = getKnownTokenInfo(id);

  const explorer = useMemo(() => {
    const isAR = id === "AR";

    return {
      name: isAR ? "Viewblock" : "AO Link",
      url: isAR ? "https://viewblock.io/arweave" : `https://www.ao.link/#/token/${id}`,
    };
  }, [id]);

  const handleLinkPress = async (url: string) => {
    browser.tabs.create({ url });
  };

  const hasSocials = useMemo(
    () => !!(tokenInfo?.socials?.twitter || tokenInfo?.socials?.github || tokenInfo?.socials?.discord),
    [tokenInfo?.socials],
  );

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
      <LinkButton onClick={() => handleLinkPress(explorer.url)}>
        <Text weight="medium" noMargin>
          {explorer.name}
        </Text>
        <ArrowUpRight style={{ width: "20px", height: "20px" }} />
      </LinkButton>
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
      {hasSocials && (
        <Flex direction="row" gap={6} align="center">
          <Text weight="medium" noMargin>
            Socials:
          </Text>
          {tokenInfo?.socials?.twitter && (
            <SocialIconButton onClick={() => handleLinkPress(tokenInfo.socials.twitter!)} aria-label="Twitter">
              <TwitterIcon />
            </SocialIconButton>
          )}
          {tokenInfo?.socials?.discord && (
            <SocialIconButton onClick={() => handleLinkPress(tokenInfo.socials.discord!)} aria-label="Discord">
              <img src={discordLogo} style={{ width: "14px", height: "14px" }} alt="Discord" />
            </SocialIconButton>
          )}
          {tokenInfo?.socials?.github && (
            <SocialIconButton onClick={() => handleLinkPress(tokenInfo.socials.github!)} aria-label="GitHub">
              <GithubIcon />
            </SocialIconButton>
          )}
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

const SocialIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 4px;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.borderDefault};
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  filter: ${({ theme }) => (theme.displayTheme === "light" ? "none" : "invert(1)")};

  &:hover {
    opacity: 0.7;
  }

  svg,
  img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
`;
