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

const TABS_CONFIG = [
  { id: 0, name: "primary", component: PrimaryTokens },
  { id: 1, name: "projects", component: ProjectsTokens },
] as const;

const TAB_PARAM_TO_ID = Object.fromEntries(TABS_CONFIG.map((tab) => [tab.name, tab.id])) as Record<string, number>;

export function EarnTabs() {
  const { navigate, location } = useLocation();
  const { tab } = useSearchParams<{ tab?: string }>();

  const activeTab = useMemo(() => TAB_PARAM_TO_ID[tab] ?? 0, [tab]);

  const setActiveTab = useCallback(
    (tabId: number) => {
      if (activeTab === tabId) return;

      const tabConfig = TABS_CONFIG[tabId];
      if (!tabConfig) return;

      navigate(location, { search: { tab: tabConfig.name } });
    },
    [navigate, location, activeTab],
  );

  return <Tabs tabs={TABS_CONFIG} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function PrimaryTokens() {
  const activeAddress = useActiveAddress();
  const { data: delegationInfo, isLoading } = useDelegationInfo();

  const coreTokens = useMemo(
    () => [
      { ...defaultTokens[1], percent: delegationInfo?.[activeAddress] || 0, comingSoon: false },
      {
        ...defaultTokens[2],
        Name: "Permaweb Index",
        percent: delegationInfo?.[PI_FLP_ID] || 0,
        comingSoon: false,
      },
      { ...defaultTokens[0], percent: 0, comingSoon: true },
    ],
    [delegationInfo, activeAddress],
  );

  return (
    <Flex direction="column" gap={16}>
      {coreTokens.map((token) => (
        <PrimaryTokenItem key={token.processId} token={token} isLoading={isLoading} />
      ))}
    </Flex>
  );
}

function PrimaryTokenItem({
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
      if (!token.processId || logo) return;
      if (token.Logo) {
        const logo = await getUserAvatar(token.Logo);
        setLogo(logo);
      } else {
        setLogo(arweaveLogo);
      }
    };
    fetchLogo();
  }, [token, arweaveLogo]);

  return (
    <Token key={token.processId}>
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
            Coming Soon
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
    </Token>
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
      }))
      .filter((token) => token.percent > 0);
  }, [flpTokens, delegationInfo]);

  console.log({ delegationInfo, flpTokens });

  return (
    <Flex direction="column" gap={16}>
      {isFlpTokensLoading ? (
        <Loading width={4} height={4} />
      ) : projects.length > 0 ? (
        projects.map((token) => <PrimaryTokenItem key={token.processId} token={token} isLoading={isLoading} />)
      ) : (
        <Flex direction="column" gap={8} textAlign="center" padding="32px 0px">
          <Text variant="secondary" weight="semibold" noMargin>
            No projects tokens
          </Text>
          <Text variant="secondary" weight="medium" size="sm" noMargin>
            Delegated AO allocation to ecosystem projects will appear here
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

const Token = styled.div`
  display: flex;
  flex-direction: row;
  padding: 4px 0;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;
