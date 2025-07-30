import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import Tabs from "~components/Tabs";
import { defaultTokens, type TokenInfo } from "~tokens/aoTokens/ao";
import { Flex } from "~components/common/Flex";
import styled, { useTheme } from "styled-components";
import { Logo } from "../Token";
import { Text, Loading } from "@arconnect/components-rebrand";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { getUserAvatar } from "~lib/avatar";
import { useTokenBalance } from "~tokens/hooks";
import { useActiveAddress } from "~wallets/hooks";
import { formatBalance } from "~utils/format";
import { useDelegationInfo, useFairLaunchTokens } from "~utils/fair_launch/fair_launch.hooks";
import { PI_FLP_ID } from "~utils/fair_launch/fair_launch.constants";
import type { FlpTokenInfo } from "~utils/fair_launch/fair_launch.types";
import browser from "webextension-polyfill";

export function EarnTabs() {
  const { navigate, location } = useLocation();
  const { tab } = useSearchParams<{ tab?: string }>();
  const { data: delegationInfo = {} } = useDelegationInfo();
  const activeAddress = useActiveAddress();

  const projectsCount = useMemo(() => {
    return Object.keys(delegationInfo).filter((key) => key !== PI_FLP_ID && key !== activeAddress).length;
  }, [delegationInfo, activeAddress]);

  const tabConfig = useMemo(() => {
    return [
      { id: 0, name: `primary_count`, component: PrimaryTokens, nameSubstitutions: ["2"], searchParam: "primary" },
      {
        id: 1,
        name: `projects_count`,
        component: ProjectsTokens,
        nameSubstitutions: [projectsCount.toString()],
        searchParam: "projects",
      },
    ];
  }, [projectsCount]);

  const tabNameToId = useMemo(
    () => Object.fromEntries(tabConfig.map((tab) => [tab.searchParam, tab.id])) as Record<string, number>,
    [tabConfig],
  );

  const activeTab = useMemo(() => tabNameToId[tab] ?? 0, [tab, tabNameToId]);

  const setActiveTab = useCallback(
    (tabId: number) => {
      if (activeTab === tabId) return;

      const tab = tabConfig[tabId];
      if (!tab) return;

      navigate(location, { search: { tab: tab.searchParam } });
    },
    [navigate, location, activeTab, tabConfig],
  );

  return <Tabs tabs={tabConfig} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function PrimaryTokens() {
  const activeAddress = useActiveAddress();
  const { data: delegationInfo = {}, isLoading } = useDelegationInfo();

  const coreTokens = useMemo(() => {
    const aoPercent = delegationInfo?.[activeAddress] || 0;
    const piPercent = delegationInfo?.[PI_FLP_ID] || 0;

    return [
      { ...defaultTokens[1], percent: aoPercent, comingSoon: false },
      {
        ...defaultTokens[2],
        Name: "Permaweb Index",
        percent: piPercent,
        comingSoon: false,
      },
      { ...defaultTokens[0], percent: 0, comingSoon: true },
    ];
  }, [delegationInfo, activeAddress]);

  return (
    <Flex direction="column" gap={16}>
      {coreTokens.map((token) => (
        <Token key={token.processId} token={token} isLoading={isLoading} />
      ))}
    </Flex>
  );
}

function ProjectsTokens() {
  const { data: flpTokens = [], isLoading: isFlpTokensLoading } = useFairLaunchTokens();
  const { data: delegationInfo = {}, isLoading } = useDelegationInfo();

  const projects = useMemo(() => {
    return flpTokens
      .map((token) => ({
        ...token,
        percent: delegationInfo?.[token.flpId] || 0,
        comingSoon: false,
      }))
      .filter((token) => token.percent > 0);
  }, [flpTokens, delegationInfo]);

  return (
    <Flex direction="column" gap={16}>
      {isFlpTokensLoading ? (
        <Loading width={4} height={4} />
      ) : projects.length > 0 ? (
        projects.map((token) => <Token key={token.processId} token={token} isLoading={isLoading} />)
      ) : (
        <Flex direction="column" gap={8} textAlign="center" padding="32px 0px">
          <Text variant="secondary" weight="semibold" noMargin>
            {browser.i18n.getMessage("no_projects_tokens")}
          </Text>
          <Text variant="secondary" weight="medium" size="sm" noMargin>
            {browser.i18n.getMessage("no_projects_tokens_description")}
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

function Token({
  token,
  isLoading,
}: {
  token: (TokenInfo | FlpTokenInfo) & { percent: number; comingSoon: boolean };
  isLoading: boolean;
}) {
  const theme = useTheme();
  const activeAddress = useActiveAddress();
  const [logo, setLogo] = useState<string | null>(null);
  const arweaveLogo = useMemo(() => (theme.displayTheme === "dark" ? arLogoDark : arLogoLight), [theme]);

  const { data: balance = "0", isLoading: isBalanceLoading } = useTokenBalance(token, activeAddress);

  const formattedBalance = useMemo(() => formatBalance(balance), [balance, token.processId]);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!token.processId) return;
      if (token.Logo) {
        const logo = await getUserAvatar(token.Logo);
        setLogo(logo);
      } else {
        setLogo(arweaveLogo);
      }
    };
    fetchLogo();
  }, [token.processId, token.Logo, arweaveLogo]);

  return (
    <TokenWrapper key={token.processId}>
      <Logo src={logo} width={40} height={40} />
      {token.comingSoon ? (
        <Flex direction="row" width="100%" justify="space-between" align="center">
          <Flex direction="column">
            <Text size="md" weight="semibold" noMargin>
              {token.Name}
            </Text>
            <Text variant="secondary" weight="medium" size="xs" noMargin>
              ${token.Ticker}
            </Text>
          </Flex>
          <Text style={{ color: "#9787FF" }} weight="medium" noMargin>
            {browser.i18n.getMessage("coming_soon")}
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap={4} width="100%">
          <Flex direction="row" gap={4} align="center" justify="space-between">
            <Text size="md" weight="semibold" noMargin>
              {token.Name}
            </Text>
            <Text weight="semibold" noMargin>
              {isLoading ? <Loading width={4} height={4} /> : `${token.percent}%`}
            </Text>
          </Flex>
          <Flex direction="row" gap={4} align="center" justify="space-between">
            <Text variant="secondary" weight="medium" size="xs" noMargin>
              ${token.Ticker}
            </Text>
            <Text variant="secondary" weight="medium" size="xs" noMargin>
              Balance: {isBalanceLoading ? <Loading width={4} height={4} /> : formattedBalance.displayBalance}
            </Text>
          </Flex>
        </Flex>
      )}
    </TokenWrapper>
  );
}

const TokenWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 4px 0;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;
