import TriangleIcon from "~components/icons/TriangleIcon";
import { useCallback, useMemo, useState } from "react";
import styled, { useTheme } from "styled-components";
import BigNumber from "bignumber.js";
import browser from "webextension-polyfill";
import { Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import { useArPrice } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { formatFiatBalance, getCurrencySymbol } from "~tokens/currency";
import { useARMarketData } from "~tokens/hooks/useArMarketData";
import { useMarketStats } from "~tokens/hooks/useMarketStats";
import { formatBalance } from "~utils/format";
import { Flex } from "~components/common/Flex";
import { LineChart } from "./LineChart";

interface PriceChartModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const getRangeDays = (range: string) => {
  switch (range) {
    case "7D":
      return "7";
    case "1M":
      return "30";
    case "3M":
      return "90";
    case "6M":
      return "180";
    case "1YR":
      return "365";
    case "ALL":
      return "max";
    default:
      return "1";
  }
};

export const PriceChartModal = ({ isOpen, setOpen }: PriceChartModalProps) => {
  const theme = useTheme();
  const [currency = "USD"] = useSetting("currency");
  const { data: arPrice = "0" } = useArPrice(currency);
  const [selectedRange, setSelectedRange] = useState("24H");
  const { marketStats } = useMarketStats();

  const { chartData, priceChangePercentage: percentage, loading, error } = useARMarketData(getRangeDays(selectedRange));
  const fiatChange = +arPrice - +arPrice / (1 + percentage.toNumber() / 100);

  const chartPoints = useMemo(() => {
    return (
      chartData?.map(([timestamp, value]) => ({
        timestamp,
        value,
      })) || []
    );
  }, [chartData]);

  const isNegative = percentage.toNumber() < 0;
  const strokeColor = isNegative ? theme.fail : theme.success;

  const handleRangeChange = useCallback(
    (range: string) => {
      if (range === selectedRange) return;

      setSelectedRange(range);
    },
    [selectedRange],
  );

  return (
    <SliderMenu
      title={browser.i18n.getMessage("token_price", ["Arweave"])}
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      height={"95vh"}
      maxHeight={"100vh"}>
      <Container>
        <PriceSection>
          <PriceValue>{formatFiatBalance(arPrice, currency)}</PriceValue>
          <Flex gap={4} align="center">
            <ChangeText>
              {percentage.isPositive() ? "+" : "-"}
              {formatFiatBalance(Math.abs(fiatChange), currency)} ({Math.abs(percentage.toNumber()).toFixed(2)}%)
            </ChangeText>
            <TriangleIcon negative={percentage.toNumber() < 0} color={strokeColor} />
          </Flex>
        </PriceSection>

        <ChartSection>
          <LineChart
            data={chartPoints}
            loading={loading}
            error={error}
            isNegative={isNegative}
            height={88}
            width="100%"
          />

          <TimeRangeContainer>
            {["24H", "7D", "1M", "3M", "6M", "1YR"].map((range) => (
              <RangeText $isSelected={selectedRange === range} onClick={() => handleRangeChange(range)}>
                {range}
              </RangeText>
            ))}
          </TimeRangeContainer>
        </ChartSection>

        <StatsSection>
          <Text size="md" weight="semibold" variant="secondary" noMargin>
            {browser.i18n.getMessage("stats")}
          </Text>
          <StatsGrid>
            <StatRow>
              <StatLabel>Market cap</StatLabel>
              <StatValue>
                {getCurrencySymbol(currency)}
                {formatBalance(BigNumber(marketStats?.marketCap ?? 0)).displayBalance}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Volume (24h)</StatLabel>
              <StatValue>
                {getCurrencySymbol(currency)}
                {formatBalance(BigNumber(marketStats?.volume24h ?? 0)).displayBalance}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>FDV</StatLabel>
              <StatValue>
                {getCurrencySymbol(currency)}
                {
                  formatBalance(
                    BigNumber((marketStats?.maxSupply ?? 0) * (marketStats?.marketCap ?? 0)).dividedBy(
                      marketStats?.circulatingSupply ?? 1,
                    ),
                  ).displayBalance
                }
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Vol/Mkt Cap (24h)</StatLabel>
              <StatValue>
                {(((marketStats?.volume24h ?? 0) / (marketStats?.marketCap ?? 1)) * 100).toFixed(2)}%
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Total supply</StatLabel>
              <StatValue>{formatBalance(BigNumber(marketStats?.totalSupply ?? 0)).displayBalance} AR</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Max. supply</StatLabel>
              <StatValue>{formatBalance(BigNumber(marketStats?.maxSupply ?? 0)).displayBalance} AR</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Circulating supply</StatLabel>
              <StatValue>{formatBalance(BigNumber(marketStats?.circulatingSupply ?? 0)).displayBalance} AR</StatValue>
            </StatRow>
          </StatsGrid>
        </StatsSection>
      </Container>
    </SliderMenu>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
`;

const PriceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PriceValue = styled(Text).attrs({ size: "3xl", weight: "bold", noMargin: true })``;

const ChangeText = styled(Text).attrs({ variant: "secondary", size: "sm", weight: "medium", noMargin: true })``;

const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TimeRangeContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
`;

const RangeText = styled.button<{ $isSelected: boolean }>`
  cursor: pointer;
  color: ${({ $isSelected, theme }) => ($isSelected ? theme.primaryText : theme.secondaryText)};
  font-weight: ${({ $isSelected }) => ($isSelected ? 600 : 500)};

  &:hover {
    color: ${({ theme }) => theme.primaryText};
  }
`;

const StatsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StatsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatLabel = styled(Text).attrs({ noMargin: true, variant: "secondary", size: "sm", weight: "medium" })``;

const StatValue = styled(Text).attrs({ noMargin: true, size: "sm", weight: "medium" })``;
