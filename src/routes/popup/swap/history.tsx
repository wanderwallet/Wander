import styled from "styled-components";
import { Section } from "@arconnect/components-rebrand";
import HeadV2 from "~components/popup/HeadV2";
import { ListItem, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import WarIcon from "url:/assets/ecosystem/war.png";
import { getStatusColor } from "~utils/agents/utils";
import { useTheme } from "styled-components";
import { SvgImageWithBackground } from "../agents/components/SvgImage";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

export function SwapHistoryView() {
  return (
    <>
      <HeadV2 title="Swap History" />

      <Wrapper>
        <Flex gap={12} direction="column">
          <SwapHistoryListItem />
        </Flex>
      </Wrapper>
    </>
  );
}

interface SwapHistoryListItemProps {}

const SwapHistoryListItem = ({}: SwapHistoryListItemProps) => {
  const theme = useTheme();
  const { navigate } = useLocation();

  return (
    <StyledListItem
      title={
        <Flex justify="space-between" align="center" width="100%">
          <Text weight="semibold" noMargin>
            waR &gt; AGENT
          </Text>
          <Flex align="center" gap={4}>
            <div
              style={{
                height: 6,
                width: 6,
                borderRadius: "50%",
                backgroundColor: getStatusColor("Active", "Active"),
              }}
            />
            <Text size="sm" weight="medium" noMargin>
              Completed
            </Text>
          </Flex>
        </Flex>
      }
      subtitle={
        <Flex justify="space-between" align="center" width="100%">
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            1 wAR &gt; 11.8758 AGENT
          </Text>
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            July 30
          </Text>
        </Flex>
      }
      squircleSize={40}
      hideSquircle={true}
      icon={
        <Flex direction="row" style={{ width: 32, position: "relative" }}>
          <SvgImageWithBackground
            height={20}
            width={20}
            style={{
              position: "absolute",
              top: -17,
              left: 2,
              border: `1px solid ${theme.displayTheme === "dark" ? "#333333" : "#D6D6DD"}`,
            }}
            src={aoLogo}
            iconSize={16}
            iconColor="black"
          />
          <img src={WarIcon} height={24} width={24} style={{ position: "absolute", bottom: -17, right: -6 }} />
        </Flex>
      }
      active
      onClick={() => navigate(PopupPaths.SwapTransactionDetails, { params: { id: "1" } })}
    />
  );
};

const StyledListItem = styled(ListItem)`
  width: 100%;
  text-align: left;
  padding: 12px 8px;
  box-sizing: border-box;
  border: 1px solid transparent;
  transition: none;
  outline: none;
  margin: 0;
  border-radius: 8px;
`;

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
`;
