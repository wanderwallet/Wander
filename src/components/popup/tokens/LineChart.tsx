import React from "react";
import styled, { useTheme } from "styled-components";
import { LineChart as RechartsLineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Text, Loading } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";

export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  loading: boolean;
  error?: boolean;
  isNegative: boolean;
  height?: number | string;
  width?: number | string;
  strokeWidth?: number;
  /**
   * Maximum number of data points to display. If not provided,
   * defaults to 50 points. Data will be automatically sampled
   * if it exceeds this limit.
   */
  maxDataPoints?: number;
}

export const LineChart = ({
  data,
  loading,
  error = false,
  isNegative,
  height = "100%",
  width = "100%",
  strokeWidth = 1.5,
  maxDataPoints,
}: LineChartProps) => {
  const theme = useTheme();

  const strokeColor = React.useMemo(
    () => (isNegative ? theme.fail : theme.success),
    [isNegative, theme.fail, theme.success],
  );

  const targetDataPoints = maxDataPoints || 50;

  const sampledData = React.useMemo(() => {
    if (!data.length || data.length <= targetDataPoints) {
      return data;
    }

    // Calculate sampling rate based on data length
    const sampleRate = Math.max(1, Math.floor(data.length / targetDataPoints));

    const result = [];
    for (let i = 0; i < data.length; i += sampleRate) {
      result.push(data[i]);
    }
    return result;
  }, [data, targetDataPoints]);

  const domainValues = React.useMemo(() => {
    if (!sampledData.length) {
      return { minValue: undefined, maxValue: undefined };
    }

    let min = sampledData[0].value;
    let max = sampledData[0].value;

    for (let i = 1; i < sampledData.length; i++) {
      const value = sampledData[i].value;
      if (value < min) min = value;
      if (value > max) max = value;
    }

    const padding = (max - min) * 0.1; // 10% padding
    return {
      minValue: min - padding,
      maxValue: max + padding,
    };
  }, [sampledData]);

  if (loading) {
    return (
      <LoadingContainer style={{ height }}>
        <Loading style={{ height: 24, width: 24 }} />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer style={{ height }}>
        <Text variant="secondary" noMargin>
          {browser.i18n.getMessage("error_loading_chart")}
        </Text>
      </ErrorContainer>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ErrorContainer style={{ height }}>
        <Text variant="secondary" noMargin>
          No data available
        </Text>
      </ErrorContainer>
    );
  }

  return (
    <ChartContainer style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={sampledData}>
          <YAxis hide type="number" domain={[domainValues.minValue, domainValues.maxValue]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const ChartContainer = styled.div`
  * {
    outline: none !important;
  }

  svg {
    outline: none !important;
  }

  path {
    outline: none !important;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
