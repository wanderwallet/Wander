import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styled from "styled-components";

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface ActivePieChartProps {
  data: PieData[];
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export const PieChart = ({
  data,
  width = 200,
  height = 200,
  innerRadius = 60,
  outerRadius = 80,
}: ActivePieChartProps) => {
  return (
    <PieChartContainer width={width} height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          stroke="none"
          strokeWidth={0}
          paddingAngle={0}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" strokeWidth={0} />
          ))}
        </Pie>
      </RechartsPieChart>
    </PieChartContainer>
  );
};

const PieChartContainer = styled(ResponsiveContainer)`
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
