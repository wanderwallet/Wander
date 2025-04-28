import styled from "styled-components";
import { Text } from "@arconnect/components-rebrand";
import { Pin02 } from "@untitled-ui/icons-react";
import { Flex } from "~components/common/Flex";
import Arrow from "url:~assets/setup/arrow.svg";
import BrowserExtension from "url:~assets/setup/browser-extension.png";
import browser from "webextension-polyfill";

export function PinExtension() {
  return (
    <Container>
      <Content>
        <Flex
          direction="row"
          align="center"
          gap={16}
          style={{ paddingRight: 20, paddingLeft: 20 }}
        >
          <Pin02
            style={{ flexShrink: 0, color: "#EEE" }}
            height={24}
            width={24}
          />
          <Text size="xs" noMargin style={{ color: "#EEE" }}>
            <span style={{ fontWeight: 700 }}>
              {browser.i18n.getMessage("pin_wander")}{" "}
            </span>
            {browser.i18n.getMessage("pin_wander_rest")}
          </Text>
        </Flex>
        <img
          height="60px"
          width="100%"
          style={{ borderRadius: 12 }}
          src={BrowserExtension}
          alt="browser-extension"
        />
      </Content>
      <img src={Arrow} alt="arrow" />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
  position: fixed;
  right: 80px;
  top: 48px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 130px;
  width: 300px;
  padding: 16px;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  border-radius: 12px;
  background: ${(props) => props.theme.primary};
`;
