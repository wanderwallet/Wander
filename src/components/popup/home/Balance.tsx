import { Loading } from "@arconnect/components-rebrand";
import { useEffect, useMemo, useState, type HTMLProps } from "react";
import { useStorage } from "~utils/storage";
import { PersistentStorage } from "~utils/storage";
import { useBalance } from "~wallets/hooks";
import { getAr24hChange, useArPrice } from "~lib/coingecko";
import useSetting from "~settings/hook";
import styled, { useTheme } from "styled-components";
import { Text } from "@arconnect/components-rebrand";
import BigNumber from "bignumber.js";
import { useTotalFiatBalance } from "~tokens/hooks";
import NumberFlow from "@number-flow/react";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

export default function Balance() {
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
    key: "saved_ar_24h_change",
    instance: PersistentStorage,
  });

  useEffect(() => {
    if (!currency) return;

    (async () => {
      try {
        if (balance === "0") {
          setPercentage(BigNumber(0));
          return;
        }
        const ar24hChange = await getAr24hChange(currency);

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
    })();
  }, [balance, currency]);

  return (
    <BalanceHead>
      {isLoading ? (
        <Loading
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
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
        style={IS_EMBEDDED_APP ? { color: "var(--color-font-body)" } : {}}>
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
        style={IS_EMBEDDED_APP ? { color: "var(--color-font-body)" } : {}}>
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

interface TriangleIconProps {
  width?: number;
  height?: number;
  color: string;
  negative?: boolean;
}

const TriangleIcon: React.FC<TriangleIconProps> = ({ width = 8.66, height = 6, color, negative = false }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 9 7"
      fill="none"
      style={{ transform: `rotate(${negative ? "180deg" : "0deg"})` }}>
      <path d="M4.49999 0.5L8.83012 6.5H0.169861L4.49999 0.5Z" fill={color || "#000000"} />
    </svg>
  );
};

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
  ${IS_EMBEDDED_APP && "color: var(--color-font-heading)"}
`;

export const CompassIcon = (props: HTMLProps<SVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...(props as any)}>
    <path
      d="M11.75 19.5C16.0302 19.5 19.5 16.0302 19.5 11.75C19.5 7.46979 16.0302 4 11.75 4C7.46979 4 4 7.46979 4 11.75C4 16.0302 7.46979 19.5 11.75 19.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.8596 8.85612C14.2383 8.72991 14.4276 8.66681 14.5535 8.7117C14.663 8.75077 14.7492 8.83698 14.7883 8.94654C14.8332 9.07243 14.7701 9.26174 14.6439 9.64037L13.491 13.0989C13.4551 13.2067 13.4371 13.2607 13.4065 13.3054C13.3794 13.3451 13.3451 13.3794 13.3054 13.4065C13.2607 13.4371 13.2067 13.4551 13.0989 13.491L9.64037 14.6439C9.26174 14.7701 9.07243 14.8332 8.94654 14.7883C8.83698 14.7492 8.75077 14.663 8.7117 14.5535C8.66681 14.4276 8.72991 14.2383 8.85612 13.8596L10.009 10.4011C10.0449 10.2933 10.0629 10.2393 10.0935 10.1946C10.1206 10.1549 10.1549 10.1206 10.1946 10.0935C10.2393 10.0629 10.2933 10.0449 10.4011 10.009L13.8596 8.85612Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
