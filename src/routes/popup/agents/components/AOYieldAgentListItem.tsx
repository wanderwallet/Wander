import { ListItem, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import UsdaIcon from "url:/assets/ecosystem/usda.svg";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";
import { SvgImage, SvgImageBackground } from "./SvgImage";

export const AOYieldAgentListItem = ({ aoYieldAgentAvailable }: { aoYieldAgentAvailable: boolean }) => {
  const { navigate } = useLocation();

  return aoYieldAgentAvailable ? (
    <ListItem
      title={
        <Flex justify="space-between" align="center" width="100%">
          <Text weight="semibold" noMargin>
            AO Yield Agent
          </Text>
          <Flex align="center" gap={4}>
            <div style={{ height: 6, width: 6, borderRadius: "50%", backgroundColor: "#56C980" }} />
            <Text size="sm" weight="medium" style={{ color: "#56C980" }} noMargin>
              Active
            </Text>
          </Flex>
        </Flex>
      }
      subtitle={
        <Flex justify="space-between" align="center" width="100%">
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            May 9 - Jun 8
          </Text>
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            5 transactions
          </Text>
        </Flex>
      }
      squircleSize={40}
      hideSquircle={true}
      icon={
        <Flex direction="row" style={{ width: 32, position: "relative" }}>
          <SvgImageBackground size={20} style={{ position: "absolute", top: -17, left: 2 }}>
            <SvgImage src={aoLogo} size={16} />
          </SvgImageBackground>
          <img src={UsdaIcon} height={24} width={24} style={{ position: "absolute", bottom: -19, right: -6 }} />
        </Flex>
      }
      active
      onClick={() => navigate(PopupPaths.CreateAOYieldAgent)}
      style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
    />
  ) : (
    <ListItem
      title={browser.i18n.getMessage("ao_yield_agent")}
      subtitle={browser.i18n.getMessage("ao_yield_agent_description")}
      subtitleStyle={{ fontSize: 10, fontWeight: 500, lineHeight: "13px" }}
      squircleSize={40}
      hideSquircle={true}
      icon={
        <SvgImageBackground>
          <SvgImage src={aoLogo} size={28} />
        </SvgImageBackground>
      }
      active
      onClick={() => navigate(PopupPaths.CreateAOYieldAgent)}
      style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
    />
  );
};
