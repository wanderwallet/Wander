import { Text } from "@arconnect/components-rebrand";
import xLogo from "url:/assets/setup/x-logo.svg";
import discordLogo from "url:/assets/setup/discord-logo.svg";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";

export function GettingStartedConnectView() {
  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_CONNECT);
  }, []);

  return (
    <Container>
      <Content alignItems="center" textAlign="center">
        <Text size="xl" weight="bold" noMargin>
          {browser.i18n.getMessage("connect_with_us_title")}
        </Text>
        <Item
          href="https://www.arconnect.io/twitter"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem"
            }}
          >
            <ImageWrapper>
              <Image
                src={xLogo}
                alt={"X Logo"}
                draggable={false}
                width={"3rem"}
                height={"3rem"}
              />
            </ImageWrapper>
            <ItemTitle>@wanderapp</ItemTitle>
          </div>
          <Text weight="medium" noMargin>
            {browser.i18n.getMessage("connect_paragraph")}
          </Text>
        </Item>
        <Item
          href="https://discord.com/invite/YGXJbuz44K"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ImageWrapper>
            <Image
              src={discordLogo}
              alt={"discord logo"}
              draggable={false}
              width={"3rem"}
              height={"3rem"}
            />
          </ImageWrapper>
          <Text weight="medium" noMargin>
            {browser.i18n.getMessage("connect_paragraph_2")}
          </Text>
        </Item>
      </Content>
    </Container>
  );
}

const ItemTitle = styled(Text).attrs({
  variant: "secondary",
  size: "sm",
  weight: "semibold",
  noMargin: true
})``;

const Item = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  background: ${({ theme }) => theme.input.background.dropdown.default};
  padding: 24px;
  border-radius: 1rem;
  text-decoration: none;
`;

const ImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
`;

const Image = styled.img<{ width: string; height: string }>`
  padding: 0.625rem;
  width: ${(props) => props.width};
  height: ${(props) => props.height};
  filter: brightness(0) saturate(100%)
    ${({ theme }) => {
      return `invert(${theme.displayTheme === "dark" ? "1" : "0"})`;
    }};
`;
