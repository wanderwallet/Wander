import { useCallback, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import Tabs from "~components/Tabs";
import { defaultTokens } from "~tokens/aoTokens/ao";
import { Flex } from "~components/common/Flex";
import styled, { useTheme } from "styled-components";
import { Text, Loading, useToasts, Tooltip } from "@arconnect/components-rebrand";
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
import { claimBalance } from "~utils/fair_launch/fair_launch.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { WarningIcon } from "~components/icons/WarningIcon";
import { NetworkErrorIcon } from "~components/icons/NetworkErrorIcon";
import { BalanceFetchError, NetworkError } from "~utils/error/error.utils";
import { DegradedMessage, NetworkErrorMessage } from "../tokens/ErrorMessages";
import { TokenLogo } from "~components/popup/TokenLogo";

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
  const { navigate } = useLocation();
  const { setToast } = useToasts();
  const activeAddress = useActiveAddress();
  const [isClaiming, setIsClaiming] = useState(false);
  const { data: claimableBalance = "0" } = useClaimableBalance(token);
  const {
    data: balance = "0",
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useTokenBalance(token, activeAddress);
  const formattedBalance = useMemo(() => formatBalance(balance), [balance, token.processId]);
  const formattedClaimableBalance = useMemo(() => formatBalance(claimableBalance), [claimableBalance]);

  const handleClaim = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (token.autoClaim) return;

        setIsClaiming(true);
        await claimBalance(token);
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

  const handleAdd = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();

      navigate(PopupPaths.ManageEarnings);
    },
    [navigate],
  );

  return (
    <TokenWrapper key={token.processId}>
      <Flex direction="row" gap={8} align="center" justify="space-between" width="100%">
        <TokenLogo token={token} style={{ flex: "1 0 auto" }} />
        {token.comingSoon ? (
          <Flex direction="row" width="100%" justify="space-between" align="center" gap={8} minWidth={0}>
            <Flex direction="column" minWidth={0}>
              <TokenName>{token.Name}</TokenName>
              <Ticker>${token.Ticker}</Ticker>
            </Flex>
            <Text
              style={{ color: theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9", flexShrink: 0 }}
              weight="medium"
              noMargin>
              {browser.i18n.getMessage("coming_soon")}
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" gap={4} width="100%" minWidth={0}>
            <Flex direction="row" gap={8} align="center" justify="space-between" width="100%">
              <TokenName>{token.Name}</TokenName>
              {isLoading || token.percent > 0 ? (
                <Text weight="semibold" noMargin>
                  {isLoading ? <Loading width={4} height={4} /> : `${token.percent}%`}
                </Text>
              ) : (
                <Link
                  onClick={handleAdd}
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9",
                  }}>
                  {browser.i18n.getMessage("add")}
                </Link>
              )}
            </Flex>
            <Flex direction="row" gap={4} align="center" justify="space-between">
              <Ticker>${token.Ticker}</Ticker>
              <Flex direction="row" gap={4} align="center" justify="center">
                <Text variant="secondary" weight="medium" size="xs" noMargin>
                  {browser.i18n.getMessage("balance")}:
                </Text>
                {isBalanceLoading ? (
                  <Loading width={4} height={4} />
                ) : balanceError instanceof BalanceFetchError ? (
                  <MessageTooltip content={DegradedMessage} position="left">
                    <WarningIcon size={12} style={{ cursor: "pointer" }} />
                  </MessageTooltip>
                ) : balanceError instanceof NetworkError ? (
                  <MessageTooltip content={NetworkErrorMessage} position="left">
                    <NetworkErrorIcon size={12} style={{ cursor: "pointer" }} />
                  </MessageTooltip>
                ) : (
                  <Text variant="secondary" weight="medium" size="xs" noMargin>
                    {formattedBalance.displayBalance}
                  </Text>
                )}
              </Flex>
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
          <Link
            onClick={handleClaim}
            style={{ fontSize: 14, fontWeight: 600, color: theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9" }}>
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
  width: 100%;
`;

const PendingDot = styled.div`
  width: 6px;
  height: 6px;
  background-color: #eebd41;
  border-radius: 50%;
  flex-shrink: 0;
`;

const TokenName = styled(Text).attrs({
  size: "md",
  weight: "semibold",
  noMargin: true,
})`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const Ticker = styled(Text).attrs({
  size: "xs",
  variant: "secondary",
  weight: "medium",
  noMargin: true,
})`
  flex-shrink: 0;
`;

const MessageTooltip = styled(Tooltip)`
  max-width: 290px;
`;
