import { useCallback, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import Tabs from "~components/Tabs";
import { defaultTokens } from "~tokens/aoTokens/ao";
import { Flex } from "~components/common/Flex";
import styled, { useTheme } from "styled-components";
import { Logo } from "../Token";
import { Text, Loading, useToasts } from "@arconnect/components-rebrand";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { getUserAvatar } from "~lib/avatar";
import { useTokenBalance } from "~tokens/hooks";
import { useActiveAddress } from "~wallets/hooks";
import { formatBalance } from "~utils/format";
import {
  useClaimableBalance,
  useDelegationInfo,
  useFairLaunchTokens,
  useHasClaimableBalance,
} from "~utils/fair_launch/fair_launch.hooks";
import { PI_FLP_ID } from "~utils/fair_launch/fair_launch.constants";
import type { FlpTokenInfo } from "~utils/fair_launch/fair_launch.types";
import browser from "webextension-polyfill";
import { Link } from "~components/common/Link";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { claimBalance } from "~utils/fair_launch/fair_launch.utils";

export function EarnTabs() {
  const { navigate, location } = useLocation();
  const { tab } = useSearchParams<{ tab?: string }>();
  const { data: delegationInfo = {} } = useDelegationInfo();
  const hasClaimableBalance = useHasClaimableBalance();
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
        icon: hasClaimableBalance && <PendingDot />,
      },
    ];
  }, [projectsCount, hasClaimableBalance]);

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
      { ...defaultTokens[1], flpId: activeAddress, percent: aoPercent, comingSoon: false, autoClaim: true },
      {
        ...defaultTokens[2],
        Name: "Permaweb Index",
        percent: piPercent,
        comingSoon: false,
        flpId: PI_FLP_ID,
        autoClaim: true,
      },
      { ...defaultTokens[0], flpId: "", percent: 0, comingSoon: true, autoClaim: true },
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
      {isFlpTokensLoading || isLoading ? (
        <Flex align="center" justify="center" padding="8px 0px">
          <Loading style={{ width: 24, height: 24 }} />
        </Flex>
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
  token: FlpTokenInfo & { percent: number; comingSoon: boolean };
  isLoading: boolean;
}) {
  const theme = useTheme();
  const { setToast } = useToasts();
  const activeAddress = useActiveAddress();
  const [isClaiming, setIsClaiming] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const arweaveLogo = useMemo(() => (theme.displayTheme === "dark" ? arLogoDark : arLogoLight), [theme]);
  const { data: claimableBalance = "0" } = useClaimableBalance(token);
  const { data: balance = "0", isLoading: isBalanceLoading } = useTokenBalance(token, activeAddress);
  const formattedBalance = useMemo(() => formatBalance(balance), [balance, token.processId]);
  const formattedClaimableBalance = useMemo(() => formatBalance(claimableBalance), [claimableBalance]);

  const handleClaim = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (token.autoClaim) return;

        setIsClaiming(true);
        await claimBalance(token.flpId, token.processId);
        setToast({
          type: "success",
          content: browser.i18n.getMessage("flp_claim_success"),
          duration: 3000,
        });
      } catch {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("flp_claim_error"),
          duration: 3000,
        });
      } finally {
        setIsClaiming(false);
      }
    },
    [token],
  );

  useAsyncEffect(async () => {
    if (!token.processId) return;
    if (token.Logo) {
      const logo = await getUserAvatar(token.Logo);
      setLogo(logo);
    } else {
      setLogo(arweaveLogo);
    }
  }, [token.processId, token.Logo, arweaveLogo]);

  return (
    <TokenWrapper key={token.processId}>
      <Flex direction="row" gap={8} align="center" justify="space-between" width="100%">
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
      </Flex>
      {!token.autoClaim &&
        claimableBalance !== "0" &&
        (isClaiming ? (
          <Flex align="center" gap={4} width="100%">
            <Text variant="secondary" weight="medium" size="xs" noMargin>
              {browser.i18n.getMessage("claiming")}...
            </Text>
            <Loading style={{ width: 14, height: 14 }} />
          </Flex>
        ) : (
          <Link onClick={handleClaim} style={{ fontSize: 14, fontWeight: 600, color: "#9787FF" }}>
            {browser.i18n.getMessage("claim")} {formattedClaimableBalance.displayBalance} {token.Ticker}
          </Link>
        ))}
    </TokenWrapper>
  );
}

const TokenWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 0;
  gap: 12px;
`;

const PendingDot = styled.div`
  width: 6px;
  height: 6px;
  background-color: #eebd41;
  border-radius: 50%;
  flex-shrink: 0;
`;
