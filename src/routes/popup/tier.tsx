import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Award03, Percent02, Star01 } from "@untitled-ui/icons-react";
import { WanderIcon } from "~components/popup/tier/WanderIcon";
import { SHOW_TIER_FEATURES, TierTypes } from "~utils/tier/constants";
import { Button, Loading, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import wanderIcon from "~assets/ecosystem/wander.svg";
import { defaultStars, AnimatedStarContainer } from "~components/common/AnimatedStarContainer";
import { useState } from "react";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";
import powerupsIcon from "~assets/images/tier/powerups.svg";
import { TierButton } from "~components/popup/tier/TierButton";
import { TierWrapper } from "~components/popup/tier/TierWrapper";
import { TierCard } from "~components/popup/tier/TierCard";
import { useActiveTier } from "~utils/tier/hooks";
import { balanceToFractioned } from "~tokens/currency";
import { TiersPopup } from "~components/popup/tier/TiersPopup";
import { TierProgress } from "~components/popup/tier/TierProgress";
import starsImage from "~assets/images/tier/stars.png";
import { WAR_PROCESS_ID } from "~tokens/aoTokens/ao";
import { useActiveAddress, useTokenTransactions } from "~wallets/hooks";
import { SectionList, SectionTitle, TransactionItemComponent } from "~components/popup/home/Transactions";
import { getFullMonthNameWithYear } from "~lib/transactions";

const stars = defaultStars.toSpliced(1, 1);

const features = [
  {
    icon: <Percent02 height={16} width={16} />,
    title: "Exclusive feature access",
  },
  {
    icon: <Star01 height={16} width={16} />,
    title: "Exclusive feature access",
  },
  {
    icon: <img src={powerupsIcon} alt="Powerups" height={16} width={16} />,
    title: "Power ups with partners",
  },
];

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
            <WanderIcon tier={tier} />
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
          <AnimatedStarContainer padding="16px" stars={stars} onClose={handleCloseCTA} showCloseButton>
            <Flex direction="column" gap={12}>
              {features.map((feature) => (
                <Flex direction="row" gap={8}>
                  <IconWrapper>{feature.icon}</IconWrapper>
                  <Text weight="semibold" noMargin>
                    {feature.title}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </AnimatedStarContainer>
        )}

        <Flex direction="column" gap={32} style={{ marginTop: 16 }}>
          <TierProgress activeTier={activeTier} />
          <Flex direction="column" gap={16} width="100%">
            <Text weight="semibold" noMargin>
              Activity
            </Text>
            <Activity />
          </Flex>
        </Flex>
      </TierWrapper>

      <TiersPopup isOpen={isOpen} setOpen={setOpen} />
    </>
  );
}

function Activity() {
  const activeAddress = useActiveAddress();
  const { transactions, loading, hasNextPage, fetchTransactions } = useTokenTransactions(activeAddress, WAR_PROCESS_ID);

  return (
    <TransactionsWrapper>
      {Object.keys(transactions).length > 0
        ? Object.keys(transactions).map((monthYear) => (
            <SectionList key={monthYear}>
              <SectionTitle>{getFullMonthNameWithYear(monthYear)}</SectionTitle>
              <TransactionItem>
                {transactions[monthYear].map((transaction) => (
                  <TransactionItemComponent key={transaction.node.id} transaction={transaction} />
                ))}
              </TransactionItem>
            </SectionList>
          ))
        : !loading && (
            <Empty>
              <TitleMessage>No activity yet</TitleMessage>
            </Empty>
          )}
      {hasNextPage && (
        <Button
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
        </Button>
      )}
    </TransactionsWrapper>
  );
}

const TransactionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionItem = styled.div`
  gap: 8px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
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
  background: #2c2c2e;

  &:active ${OptionsIcon} {
    transform: scale(0.93);
  }
`;

const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #342888;
  display: flex;
  align-items: center;
  justify-content: center;
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
`;
