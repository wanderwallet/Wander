import { type DisplayTheme, Section, Text } from "@arconnect/components";
import { type HTMLProps, type ReactNode, useMemo } from "react";
import { useTheme as useDisplayTheme } from "~utils/theme";
import styled, { useTheme } from "styled-components";

export default function Graph({
  children,
  actionBar,
  data,
  blur,
  ...props
}: Omit<HTMLProps<HTMLDivElement>, "data"> & GraphProps) {
  const theme = useDisplayTheme();

  return (
    <GraphSection size="slim">
      <Wrapper {...(props as any)} displayTheme={theme}>
        <Content>
          <ChildrenWrapper>{children}</ChildrenWrapper>
          {actionBar && <ActionBar>{actionBar}</ActionBar>}
        </Content>
        <Chart data={data} blur={blur} />
      </Wrapper>
    </GraphSection>
  );
}

interface GraphProps {
  actionBar?: ReactNode;
  data: number[];
  blur?: boolean;
}

const GraphSection = styled(Section)`
  padding-top: 0;
  padding-bottom: 0.3rem;
`;

// TODO: update cardBackground entirely in @arconnect/components - light mode still WIP
const Wrapper = styled.div<{ displayTheme: DisplayTheme }>`
  position: relative;
  background-color: rgb(${(props) => (props.displayTheme === "light" ? "243, 240, 255" : "171, 154, 255, 0.15")});
  border: 1.5px solid rgb(171, 154, 255, 0.15);
  border-radius: 27.5px;
  overflow: hidden;
  z-index: 1;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  color: #fff;
  height: 188px;
  z-index: 20;
  gap: 1.75rem;
`;

const ChildrenWrapper = styled.div`
  padding: 1.2rem;
  z-index: 1;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.2rem;
  z-index: 1;
`;

const Chart = ({ data, blur }: ChartProps) => {
  const theme = useTheme();

  // graph dimensions
  const height = 140;
  const width = 500;

  const path = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);

    return (
      `M0 ${height} ` +
      data
        .map((val, i) => {
          // vertical pos
          // we calculate it like this:
          // 1. Subtract the minimum value from the val & max
          // 2. Get the ratio of the value / max element of the dataset
          // 3. Get the pixel size of 1% of the graph height
          // 4. Multiply the calculated ratio with the 1% size
          const percentage = ((val - min) / (max - min)) * 100;
          const v = height - percentage * (height / 100);

          // horizontal pos
          // we calculate it by dividing it with our data size to
          // split the total length into sections of equal width
          const h = (width / (data.length - 1)) * i;

          return "L" + h + " " + v;
        })
        .join(" ") +
      ` L${width} ${height} Z`
    );
  }, [data]);

  return (
    <ChartSvg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      blur={blur}>
      <path d={path} fill={`rgb(${theme.theme})`} stroke={`rgb(${theme.theme})`} strokeWidth="2" />
      {data.length > 0 && !(data.length === 1 && data[0] === 0) && (
        <rect y={height} width={width} height="115" fill={`rgb(${theme.theme})`} />
      )}
    </ChartSvg>
  );
};

const ChartSvg = styled.svg<{ blur?: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: -1;
  ${(props) => (props.blur ? "filter: blur(5px);" : "")}

  path, rect {
    transition: all 0.7s cubic-bezier(0.06, 1.05, 0.57, 1);
  }
`;

export const GraphText = styled(Text)`
  line-height: 1em;
  color: ${(props) => (props.theme.displayTheme === "light" ? "#AB9AFF" : "#fff")};

  span {
    font-size: 0.6em;
  }
`;

interface ChartProps {
  data: number[];
  blur?: boolean;
}
