import React, { useMemo, useCallback, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useArPrice, type CoinGeckoSymbol } from "~lib/coingecko";
import { formatFiatBalance } from "~tokens/currency";
import { Text } from "@arconnect/components-rebrand";
import { useTokenMarketData } from "~tokens/hooks/useTokenMarketData";
import useSetting from "~settings/hook";
import TriangleIcon from "~components/icons/TriangleIcon";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { PriceChartModal } from "./PriceChartModal";
import { LineChart } from "../chart/LineChart";
import { useTokenPrice } from "~tokens/hooks";
import { AR_PROCESS_ID, AO_PROCESS_ID } from "~tokens/aoTokens/ao";

interface PriceChartProps {
  symbol: CoinGeckoSymbol;
}

export const PriceChart = ({ symbol }: PriceChartProps) => {
  const theme = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currency = "USD"] = useSetting("currency");
  const { chartData, loading, priceChangePercentage: percentage } = useTokenMarketData(symbol);
  const { price = 0 } = useTokenPrice(symbol === "arweave" ? AR_PROCESS_ID : AO_PROCESS_ID, currency);

  const { fiatChange, percentageNumber, isNegative } = useMemo(() => {
    const percentageNum = percentage.toNumber();
    const negative = percentage.isNegative();
    const tokenPrice = price || 0;
    const change = tokenPrice - tokenPrice / (1 + percentageNum / 100);

    return {
      fiatChange: change,
      percentageNumber: percentageNum,
      isNegative: negative,
    };
  }, [price, percentage]);

  const chartPoints = useMemo(() => {
    return (
      chartData?.map(([timestamp, value]) => ({
        timestamp,
        value,
      })) || []
    );
  }, [chartData]);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const strokeColor = useMemo(() => (isNegative ? theme.fail : theme.success), [isNegative, theme.fail, theme.success]);

  return (
    <>
      <PriceChartContainer onClick={handleOpen}>
        <Flex justify="space-between" align="center">
          <Flex direction="column" gap={10} width="100%">
            <Text variant="secondary" weight="semibold" noMargin>
              {browser.i18n.getMessage("price")}
            </Text>

            <Flex justify="space-between" align="center">
              <Flex gap={4} direction="column">
                <Text size="xl" weight="semibold" noMargin>
                  {formatFiatBalance(price, currency)}
                </Text>
                <Flex gap={4} align="center">
                  <FiatBalanceText>
                    {formatFiatBalance(fiatChange, currency)} ({Math.abs(percentageNumber).toFixed(2)}
                    %)
                  </FiatBalanceText>
                  <div style={{ paddingTop: 4 }}>
                    <TriangleIcon negative={isNegative} color={strokeColor} />
                  </div>
                </Flex>
              </Flex>

              <LineChart data={chartPoints} loading={loading} isNegative={isNegative} height="57px" width="140px" />
            </Flex>
          </Flex>
        </Flex>
      </PriceChartContainer>
      <PriceChartModal isOpen={isModalOpen} setOpen={setIsModalOpen} symbol={symbol} />
    </>
  );
};

const FiatBalanceText = styled(Text).attrs({ noMargin: true, variant: "secondary", weight: "medium" })``;

const PriceChartContainer = styled.div`
  display: flex;
  cursor: pointer;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.borderSecondary};
  border-radius: 8px;
  padding: 16px;
  gap: 10px;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
`;
