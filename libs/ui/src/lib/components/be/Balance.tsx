import { Loading } from "@arconnect/components-rebrand";
import { useEffect, useMemo, useState } from "react";
import { getToken24hChange, PersistentStorage, useArPrice, useAsyncEffect, useBalance, useSetting, useStorage, useTotalFiatBalance } from "@wanderapp/core";
import styled, { useTheme } from "styled-components";
import { Text } from "@arconnect/components-rebrand";
import BigNumber from "bignumber.js";
import NumberFlow from "@number-flow/react";
import { TriangleIcon } from "@iconicicons/react";

export function Balance() {
  // balance in AR
  const { data: balance = "0", isLoading } = useBalance();
  const [percentage, setPercentage] = useState(BigNumber("0"));

  // balance in local currency
  const [currency] = useSetting<string>("currency");
  const { data: price = "0" } = useArPrice(currency);
  const fiat = useMemo(() => BigNumber(price).multipliedBy(balance || BigNumber("0")), [price, balance]);
  const totalFiatBalance = useTotalFiatBalance();

  // balance display
  const [hideBalance, setHideBalance] = useStorage<boolean>(
    {
      key: "hide_balance",
      instance: PersistentStorage,
    },
    false,
  );

  useEffect(() => {
    if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") return;

    // TODO: The balance and fiat balance should be loaded and calculated from a provider / background service. Relying
    // on a comment, that might or might not render, to update the SDK balance, is a rather poor implementation.

    if (hideBalance) {
      const fakeAmount = 888.88;
      const formattedFakeBalance = Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(fakeAmount);

      postEmbeddedMessage({
        type: "embedded_balance",
        data: {
          amount: null,
          currency: null,
          formattedBalance: formattedFakeBalance,
        },
      });

      return;
    }

    const amount = totalFiatBalance.toNumber();
    const formattedBalance = Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);

    postEmbeddedMessage({
      type: "embedded_balance",
      data: {
        amount,
        currency: currency as "USD",
        formattedBalance,
      },
    });
  }, [hideBalance, totalFiatBalance, currency]);

  const [savedAr24hChange, setSavedAr24hChange] = useStorage<{
    value: number;
    timestamp: string;
  }>({
    key: "saved_arweave_24h_change",
    instance: PersistentStorage,
  });

  useAsyncEffect(async () => {
    if (!currency) return;

    try {
      if (balance === "0") {
        setPercentage(BigNumber(0));
        return;
      }

      const ar24hChange = await getToken24hChange("arweave", currency);

      setSavedAr24hChange({
        value: ar24hChange,
        timestamp: Date.now().toString(),
      });

      setPercentage(BigNumber(ar24hChange));
    } catch (error) {
      console.error("Error fetching AR 24h change:", error);

      // Check if we have a saved value
      if (savedAr24hChange) {
        const fallbackPercentage = BigNumber(savedAr24hChange.value);
        setPercentage(fallbackPercentage);
      } else {
        setPercentage(BigNumber(0));
      }
    }
  }, [balance, currency]);

  return (
    <BalanceHead>
      {isLoading ? (
        <Loading
          style={{
            position: "absolute",
            top: "calc(50% - 10px)",
            left: "calc(50% - 10px)",
            width: "20px",
            height: "20px",
          }}
        />
      ) : null}

      <BalanceWrapper $hideBalance={hideBalance || isLoading}>
        <BalanceText onClick={() => setHideBalance((val) => !val)} noMargin>
          <NumberFlow
            value={totalFiatBalance}
            format={{
              style: "currency",
              currency: currency,
            }}
          />
        </BalanceText>

        <PriceChangeIndicator
          percentageChange={percentage}
          fiatChange={fiat.multipliedBy(percentage.dividedBy(100))}
          hideBalance={hideBalance}
        />
      </BalanceWrapper>
    </BalanceHead>
  );
}

function PriceChangeIndicator({
  percentageChange,
  fiatChange,
}: {
  percentageChange: BigNumber;
  fiatChange: BigNumber;
  hideBalance?: boolean;
}) {
  const theme = useTheme();
  const [currency] = useSetting<string>("currency");
  const isPositive = percentageChange.isGreaterThanOrEqualTo(0);
  const isZeroChange = percentageChange.isEqualTo(0);

  return (
    <PercentageChangeContainer>
      <Text
        variant="secondary"
        weight="medium"
        noMargin
        style={import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? { color: "var(--color-font-body)" } : {}}>
        <NumberFlow
          value={fiatChange}
          format={{
            style: "currency",
            currency: currency,
          }}
        />
      </Text>
      <Text
        variant="secondary"
        weight="medium"
        noMargin
        style={import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? { color: "var(--color-font-body)" } : {}}>
        (
        <NumberFlow
          value={Math.abs(Number(percentageChange.toFixed(2)) / 100)}
          format={{
            style: "percent",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
        />
        )
      </Text>
      {!isZeroChange && <TriangleIcon negative={!isPositive} color={isPositive ? theme.success : theme.fail} />}
    </PercentageChangeContainer>
  );
}

const BalanceWrapper = styled.div<{ $hideBalance?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: filter linear 300ms;
  filter: ${({ $hideBalance }) => ($hideBalance ? "blur(8px)" : "blur(0px)")};
  user-select: ${({ $hideBalance }) => ($hideBalance ? "none" : "auto")};
`;

const PercentageChangeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const BalanceHead = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0px;
  height: 78.5px;
`;

const BalanceText = styled(Text).attrs({
  size: "4xl",
  weight: "medium",
  noMargin: true,
})`
  cursor: pointer;
  text-align: center;
  ${import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "color: var(--color-font-heading)" : ""}
`;
