import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { ArrowUpRight, Award03 } from "@untitled-ui/icons-react";
import { WanderIcon } from "~components/popup/tier/WanderIcon";
import { EXPLORE_TIER_BENEFITS, TierTypes } from "~utils/tier/constants";
import { Loading, Text, Tooltip } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import wanderIcon from "~assets/ecosystem/wander.svg";
import { defaultStars, AnimatedStarContainer } from "~components/common/AnimatedStarContainer";
import { useEffect, useMemo, useState } from "react";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";
import { TierButton } from "~components/popup/tier/TierButton";
import { TierWrapper } from "~components/popup/tier/TierWrapper";
import { TierCard } from "~components/popup/tier/TierCard";
import { useActiveTier, useWalletLifetimeSavings } from "~utils/tier/hooks";
import { balanceToFractioned } from "~tokens/currency";
import { TiersPopup } from "~components/popup/tier/TiersPopup";
import { TierProgress } from "~components/popup/tier/TierProgress";
import { defaultTokens, WNDR_PROCESS_ID } from "~tokens/aoTokens/ao";
import { useActiveAddress, useTokenTransactions } from "~wallets/hooks";
import { TierTransactionItemComponent } from "~components/popup/home/Transactions";
import type { Tier } from "~utils/tier/types";
import { GetTokensButton } from "~components/popup/tier/GetTokensButton";
import { trackPage, PageType } from "~utils/analytics";
import CustomizableStars from "~components/popup/tier/CustomizableStars";
import { formatBalance } from "~utils/format";
import { ParseTextWithLinks } from "~components/common/ParseTextWithLinks";
import { Link } from "~components/common/Link";

const stars = defaultStars.toSpliced(1, 1);
const wanderTokenInfo = defaultTokens[3];

export function TierView() {
  const [isOpen, setOpen] = useState(false);
  const [showExploreTierBenefits, setShowExploreTierBenefits] = useState(false);
  const { data: savings = "0", isLoading } = useWalletLifetimeSavings();
  const { data: activeTier } = useActiveTier();

  const formattedBalance = useMemo(() => {
    const fractionedBalance = balanceToFractioned(String(activeTier?.balance ?? 0), {
      decimals: wanderTokenInfo.Denomination,
    });
    return formatBalance(fractionedBalance);
  }, [activeTier?.balance]);

  const tier = activeTier?.tier ?? TierTypes.Core;

  const showTierProgress = useMemo(() => {
    return +(activeTier?.balance ?? 0) > 0 || Number(savings) > 0;
  }, [activeTier?.balance, savings]);

  const handleCloseCTA = () => {
    ExtensionStorage.set(EXPLORE_TIER_BENEFITS, false);
    setShowExploreTierBenefits(false);
  };

  useAsyncEffect(async () => {
    const storedValue = await ExtensionStorage.get<boolean>(EXPLORE_TIER_BENEFITS);
    setShowExploreTierBenefits(storedValue ?? true);
  }, []);

  useEffect(() => {
    trackPage(PageType.YOUR_TIER);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("your_tier")}
        optionsIcon={
          <OptionsIconWrapper onClick={() => setOpen(true)}>
            <div>
              <OptionsIcon />
              <Text weight="medium" noMargin>
                {browser.i18n.getMessage("tiers")}
              </Text>
            </div>
          </OptionsIconWrapper>
        }
      />
      <TierWrapper tier={tier}>
        <TierCard tier={tier}>
          <CustomizableStars
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -65%)", zIndex: 1 }}
            tier={tier}
          />
          <Flex direction="row" gap={4} align="center" justify="center">
            <WanderIcon height={15} width={32} tier={tier} />
            <Text size="xs" weight="semibold" noMargin>
              {tier}
            </Text>
          </Flex>
          <Flex direction="row" gap={4} align="baseline" justify="center">
            {formattedBalance?.showTooltip ? (
              <BalanceTooltip content={formattedBalance.tooltipBalance} position="top">
                <NativeBalance showCursor>{formattedBalance.displayBalance}</NativeBalance>
              </BalanceTooltip>
            ) : (
              <NativeBalance>{formattedBalance.displayBalance}</NativeBalance>
            )}
            <Text variant="secondary" weight="medium" noMargin>
              WNDR
            </Text>
            <WanderRoundIcon src={wanderIcon} alt="Wander" />
          </Flex>
        </TierCard>

        <GetTokensButton tier={tier} />

        {showExploreTierBenefits && (
          <AnimatedStarContainer
            stars={stars}
            onClick={() => setOpen(true)}
            onClose={handleCloseCTA}
            style={{ cursor: "pointer" }}
            showCloseButton>
            <Text weight="semibold" noMargin>
              {browser.i18n.getMessage("explore_tier_benefits")}
            </Text>
          </AnimatedStarContainer>
        )}

        <Flex direction="column" gap={24} style={{ marginTop: 8 }}>
          {showTierProgress ? (
            <>
              <TierProgress activeTier={activeTier} />
              <LifeTimeSavings savings={savings} isLoading={isLoading} />
            </>
          ) : (
            <WanderTokenGetStarted />
          )}

          <Flex direction="column" gap={16} width="100%">
            <Text weight="semibold" noMargin>
              {browser.i18n.getMessage("activity")}
            </Text>
            <Activity tier={tier} />
          </Flex>
        </Flex>
      </TierWrapper>

      <TiersPopup isOpen={isOpen} setOpen={setOpen} />
    </>
  );
}

function Activity({ tier }: { tier: Tier }) {
  const activeAddress = useActiveAddress();
  const { transactions, loading, hasNextPage, fetchTransactions } = useTokenTransactions(
    activeAddress,
    WNDR_PROCESS_ID,
  );

  return (
    <TransactionsWrapper gap={8}>
      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <TierTransactionItemComponent key={transaction.node.id} transaction={transaction} />
        ))
      ) : (
        <Empty>
          {loading ? (
            <Loading style={{ height: "20px", width: "20px" }} />
          ) : (
            <TitleMessage>No activity yet</TitleMessage>
          )}
        </Empty>
      )}
      {hasNextPage && (
        <TierButton
          tier={tier}
          fullWidth
          disabled={!hasNextPage || loading}
          style={{ alignSelf: "center", marginTop: "5px" }}
          onClick={fetchTransactions}>
          {loading ? <Loading style={{ margin: "0.18rem" }} /> : browser.i18n.getMessage("load_more") + "..."}
        </TierButton>
      )}
    </TransactionsWrapper>
  );
}

function LifeTimeSavings({ savings, isLoading }: { savings: string; isLoading: boolean }) {
  const formattedSavings = useMemo(() => {
    const savingsInUSD = Number(savings || 0);
    if (savingsInUSD === 0) return "$0.00";
    if (savingsInUSD < 0.01) return "< $0.01";
    return `$${savingsInUSD.toFixed(2)}`;
  }, [savings]);

  return (
    <InfoCardWrapper>
      <Text variant="secondary" size="sm" weight="semibold" noMargin>
        {browser.i18n.getMessage("your_lifetime_savings")}:
      </Text>
      {isLoading ? (
        <Loading style={{ height: "20px", width: "20px" }} />
      ) : (
        <Text size="xl" weight="semibold" noMargin>
          {formattedSavings}
        </Text>
      )}
    </InfoCardWrapper>
  );
}

function WanderTokenGetStarted() {
  return (
    <InfoCardWrapper alignItems="flex-start" gap="16px">
      <Text size="sm" weight="semibold" noMargin>
        {browser.i18n.getMessage("tier_core_title")}
      </Text>

      <Text variant="secondary" style={{ fontSize: 13, lineHeight: "150%" }} weight="medium" noMargin>
        <ParseTextWithLinks text={browser.i18n.getMessage("tier_core_description")} />
      </Text>

      <Link
        href="https://www.wander.app/blog/wndr-fair-launch"
        style={{ color: "inherit", gap: "4px", alignItems: "center", fontSize: 15, fontWeight: 600 }}>
        {browser.i18n.getMessage("learn_more")} <ArrowUpRight height={18} width={18} />
      </Link>
    </InfoCardWrapper>
  );
}

const TransactionsWrapper = styled.div<{ gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap ?? 12}px;
`;

const Empty = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TitleMessage = styled(Text).attrs({
  weight: "semibold",
  noMargin: true,
})``;

const OptionsIcon = styled(Award03)`
  height: 20px;
  width: 20px;
  color: ${(props) => props.theme.primaryText};
`;

const OptionsIconWrapper = styled.div`
  position: relative;
  padding: 0.75px;
  border-radius: 8px;
  box-sizing: border-box;

  @property --angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    --angle: 0deg;
    background: conic-gradient(
      from var(--angle),
      #6b57f9 0deg,
      rgba(151, 135, 255, 0.8) 45deg,
      rgba(151, 135, 255, 0.4) 90deg,
      rgba(151, 135, 255, 0.2) 135deg,
      rgba(151, 135, 255, 0.3) 180deg,
      rgba(151, 135, 255, 0.5) 225deg,
      rgba(151, 135, 255, 0.8) 270deg,
      rgba(151, 135, 255, 0.9) 315deg,
      #6b57f9 360deg
    );
    animation: borderRotate 3s linear infinite;
    z-index: 0;
  }

  @keyframes borderRotate {
    from {
      --angle: 0deg;
    }
    to {
      --angle: 360deg;
    }
  }

  & > div {
    position: relative;
    z-index: 1;
    display: flex;
    height: 28px;
    padding: 4px 8px;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    border-radius: 8px;
    background: ${(props) => props.theme.surfaceDefault};
    box-shadow:
      inset 0 0 5px rgba(160, 160, 160, 0.4),
      inset 0 1px 2px rgba(255, 255, 255, 0.6),
      inset 0 1px 13px rgba(90, 93, 94, 0.2);
    backdrop-filter: blur(7.55px);
    box-sizing: border-box;
    gap: 5px;

    &:hover {
      background: ${(props) => props.theme.surfaceSecondary};
    }
  }

  &:active {
    transform: scale(0.93);
  }
`;

const InfoCardWrapper = styled.div<{ alignItems?: "center" | "flex-start"; gap?: string }>`
  display: flex;
  padding: 12px;
  flex-direction: column;
  align-items: ${({ alignItems }) => alignItems ?? "center"};
  gap: ${({ gap }) => gap ?? "8px"};
  align-self: stretch;

  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.backgroundSecondary};
  background: ${(props) => props.theme.surfaceDefault};
`;

const WanderRoundIcon = styled.img`
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  align-self: baseline;
  transform: translateY(4px);
`;

const NativeBalance = styled(Text).attrs({
  noMargin: true,
  weight: "semibold",
  size: "4xl",
})<{ showCursor?: boolean }>`
  z-index: 1;
  cursor: ${({ showCursor }) => (showCursor ? "pointer" : "default")};
`;

const BalanceTooltip = styled(Tooltip)`
  margin-bottom: -16px;
  z-index: 1;
`;
