import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Award03 } from "@untitled-ui/icons-react";
import { WanderIcon } from "~components/popup/tier/WanderIcon";
import { SHOW_TIER_FEATURES, TierTypes } from "~utils/tier/constants";
import { Loading, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import wanderIcon from "~assets/ecosystem/wander.svg";
import { defaultStars, AnimatedStarContainer } from "~components/common/AnimatedStarContainer";
import { useMemo, useState } from "react";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";
import { TierButton } from "~components/popup/tier/TierButton";
import { TierWrapper } from "~components/popup/tier/TierWrapper";
import { TierCard } from "~components/popup/tier/TierCard";
import { useActiveTier, useWalletSavings } from "~utils/tier/hooks";
import { balanceToFractioned } from "~tokens/currency";
import { TiersPopup } from "~components/popup/tier/TiersPopup";
import { TierProgress } from "~components/popup/tier/TierProgress";
import starsImage from "~assets/images/tier/stars.png";
import { WAR_PROCESS_ID } from "~tokens/aoTokens/ao";
import { useActiveAddress, useTokenTransactions } from "~wallets/hooks";
import { TierTransactionItemComponent } from "~components/popup/home/Transactions";
import type { Tier } from "~utils/tier/types";

const stars = defaultStars.toSpliced(1, 1);

export function TierView() {
  const [isOpen, setOpen] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const { data: activeTier } = useActiveTier();

  const tier = activeTier?.tier ?? TierTypes.Select;

  const handleCloseCTA = () => {
    ExtensionStorage.set(SHOW_TIER_FEATURES, false);
    setShowFeatures(false);
  };

  useAsyncEffect(async () => {
    const storedValue = await ExtensionStorage.get<boolean>(SHOW_TIER_FEATURES);
    setShowFeatures(storedValue ?? true);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("your_tier")}
        optionsIcon={
          <OptionsIconWrapper onClick={() => setOpen(true)}>
            <OptionsIcon />
          </OptionsIconWrapper>
        }
      />
      <TierWrapper tier={tier}>
        <StarsBackground />
        <TierCard tier={tier}>
          <Flex direction="row" gap={4} align="center" justify="center">
            <WanderIcon height={15} width={32} tier={tier} />
            <Text size="xs" weight="semibold" noMargin>
              {tier}
            </Text>
          </Flex>
          <Flex direction="row" gap={4} align="baseline" justify="center">
            <Text size="4xl" weight="semibold" noMargin>
              {balanceToFractioned(String(activeTier?.progress?.currentBalance ?? 0), { decimals: 12 }).toFixed(2)}
            </Text>
            <Text variant="secondary" weight="medium" noMargin>
              WNDR
            </Text>
            <img src={wanderIcon} alt="Wander" height={24} width={24} />
          </Flex>
        </TierCard>

        <TierButton tier={tier} onClick={() => browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" })}>
          Get WNDR tokens
        </TierButton>

        {showFeatures && (
          <AnimatedStarContainer
            stars={stars}
            onClick={() => setOpen(true)}
            onClose={handleCloseCTA}
            style={{ cursor: "pointer" }}
            showCloseButton>
            <Text weight="semibold" noMargin>
              Explore tier benefits
            </Text>
          </AnimatedStarContainer>
        )}

        <Flex direction="column" gap={32} style={{ marginTop: 16 }}>
          <TierProgress activeTier={activeTier} />
          <LifeTimeSavings />
          <Flex direction="column" gap={16} width="100%">
            <Text weight="semibold" noMargin>
              Activity
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
  const { transactions, loading, hasNextPage, fetchTransactions } = useTokenTransactions(activeAddress, WAR_PROCESS_ID);

  return (
    <TransactionsWrapper gap={8}>
      {transactions.length > 0
        ? transactions.map((transaction) => (
            <TierTransactionItemComponent key={transaction.node.id} transaction={transaction} />
          ))
        : !loading && (
            <Empty>
              <TitleMessage>No activity yet</TitleMessage>
            </Empty>
          )}
      {hasNextPage && (
        <TierButton
          tier={tier}
          fullWidth
          disabled={!hasNextPage || loading}
          style={{ alignSelf: "center", marginTop: "5px" }}
          onClick={fetchTransactions}>
          {loading ? (
            <>
              Loading <Loading style={{ margin: "0.18rem" }} />
            </>
          ) : (
            browser.i18n.getMessage("load_more") + "..."
          )}
        </TierButton>
      )}
    </TransactionsWrapper>
  );
}

function LifeTimeSavings() {
  const { data: savings = "0", isLoading } = useWalletSavings();

  const formattedSavings = useMemo(() => {
    const savingsInUSD = Number(savings || 0);
    if (savingsInUSD < 0.01) return "< $0.01";
    return `$${savingsInUSD.toFixed(2)}`;
  }, [savings]);

  return (
    <LifeTimeSavingsWrapper>
      <Text variant="secondary" size="sm" weight="semibold" noMargin>
        Your lifetime savings:
      </Text>
      {isLoading ? (
        <Loading style={{ height: "20px", width: "20px" }} />
      ) : (
        <Text size="xl" weight="semibold" noMargin>
          {formattedSavings}
        </Text>
      )}
    </LifeTimeSavingsWrapper>
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
  color: #fff;
`;

const OptionsIconWrapper = styled.div`
  display: flex;
  width: 28px;
  height: 28px;
  padding: 4px;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: 8px;
  background: ${(props) => props.theme.surfaceTertiary};
  box-sizing: border-box;

  &:active ${OptionsIcon} {
    transform: scale(0.93);
  }
`;

const StarsBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 245px;
  height: 56.322px;
  margin-left: 60px;
  margin-top: 16px;
  background: url(${starsImage}) no-repeat center center;
  background-size: 100% 100%;
  flex-shrink: 0;
  pointer-events: none;
  z-index: 1;
  border-radius: 8px;
  /* Ensure this decorative background doesn't interfere with content */
  mix-blend-mode: screen;
  opacity: 0.8;
`;

const LifeTimeSavingsWrapper = styled.div`
  display: flex;
  padding: 12px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  align-self: stretch;

  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.backgroundSecondary};
  background: ${(props) => props.theme.surfaceDefault};
`;
