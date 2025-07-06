import { Text } from "@arconnect/components-rebrand";
import styled from "styled-components";

interface ProgressSegment {
  activeBackgroundColor: string;
  backgroundColor: string;
  percentage: number; // 0-100, segments should add up to 100
  name: string;
}

interface ProgressBarProps {
  progress: number; // 0-100
  segments?: ProgressSegment[];
  width?: number;
  height?: number;
  borderRadius?: number;
  separatorWidth?: number;
  separatorColor?: string;
  showProgressLine?: boolean;
  progressLineColor?: string;
  progressLineWidth?: number;
  showSegmentLabels?: boolean;
}

const defaultSegments: ProgressSegment[] = [
  { percentage: 20, name: "Core", backgroundColor: "rgba(107, 87, 249, 0.20)", activeBackgroundColor: "#6B57F9" },
  { percentage: 30, name: "Select", backgroundColor: "rgba(40, 73, 86, 0.20)", activeBackgroundColor: "#284956" },
  { percentage: 30, name: "Reserve", backgroundColor: "rgba(110, 224, 152, 0.20)", activeBackgroundColor: "#6EE098" },
  { percentage: 18, name: "Edge", backgroundColor: "rgba(212, 212, 212, 0.20)", activeBackgroundColor: "#D4D4D4" },
  { percentage: 2, name: "Prime", backgroundColor: "rgba(212, 212, 212, 0.20)", activeBackgroundColor: "#C89A3F" },
];

export function ProgressBar({
  progress,
  segments = defaultSegments,
  width = 330,
  height = 16,
  borderRadius = 8,
  separatorWidth = 1,
  showProgressLine = true,
  progressLineColor = "#EEE",
  progressLineWidth = 4,
  showSegmentLabels = true,
}: ProgressBarProps) {
  // Calculate dimensions
  const totalSeparatorWidth = (segments.length - 1) * separatorWidth;
  const availableWidth = width - totalSeparatorWidth;
  const exactProgressWidth = (progress / 100) * width;

  // Calculate segment positions and widths with cumulative percentage ranges
  let accumulatedPercentage = 0;
  let accumulatedWidth = 0;
  const segmentData = segments.map((segment, index) => {
    const actualWidth = (segment.percentage / 100) * availableWidth;
    const start = accumulatedWidth;
    const startPercentage = accumulatedPercentage;
    const endPercentage = accumulatedPercentage + segment.percentage;

    // A segment is active if progress has entered its range
    const isCompletelyFilled = progress > startPercentage;

    // Update accumulated values for next iteration
    accumulatedPercentage += segment.percentage;
    accumulatedWidth += actualWidth + (index < segments.length - 1 ? separatorWidth : 0);

    return {
      ...segment,
      actualWidth,
      start,
      startPercentage,
      endPercentage,
      isCompletelyFilled,
    };
  });

  const activeSegment = segmentData.findLast((segment) => segment.isCompletelyFilled);

  return (
    <ProgressContainer width={width} height={height} $borderRadius={borderRadius} $showLabels={showSegmentLabels}>
      <SegmentsContainer>
        {segmentData.map((segment, index) => (
          <SegmentWrapper key={`segment-${index}`}>
            <Segment
              $width={segment.actualWidth}
              $height={height}
              $backgroundColor={activeSegment?.backgroundColor}
              $isActive={segment.isCompletelyFilled}
              $activeBackgroundColor={activeSegment?.activeBackgroundColor}
              $isFirst={index === 0}
              $isLast={index === segments.length - 1}
              $borderRadius={borderRadius}
            />
          </SegmentWrapper>
        ))}
      </SegmentsContainer>

      {showSegmentLabels && (
        <SegmentLabelsContainer>
          {segmentData.map((segment, index) => (
            <SegmentLabel
              key={`label-${index}`}
              $position={segment.start}
              $width={segment.actualWidth}
              $isActive={segment.isCompletelyFilled}>
              {segment.name}
            </SegmentLabel>
          ))}
        </SegmentLabelsContainer>
      )}

      {showProgressLine && exactProgressWidth >= 0 && exactProgressWidth <= width && (
        <ProgressLine
          $position={exactProgressWidth}
          $width={progressLineWidth}
          $height={height}
          $color={progressLineColor}
        />
      )}
    </ProgressContainer>
  );
}

const ProgressContainer = styled.div<{
  width?: number;
  height: number;
  $borderRadius: number;
  $showLabels: boolean;
}>`
  width: ${(props) => (props.width ? `${props.width}px` : "100%")};
  height: ${(props) => props.height}px;
  border-radius: ${(props) => props.$borderRadius}px;
  position: relative;
  display: flex;
  margin-bottom: ${(props) => (props.$showLabels ? "28px" : "0")};
`;

const SegmentsContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  align-items: center;
`;

const SegmentWrapper = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
`;

const Segment = styled.div<{
  $width: number;
  $height: number;
  $backgroundColor: string;
  $isActive: boolean;
  $activeBackgroundColor: string;
  $isFirst: boolean;
  $isLast: boolean;
  $borderRadius: number;
}>`
  width: ${(props) => props.$width}px;
  height: ${(props) => props.$height}px;
  background-color: ${(props) => (props.$isActive ? props.$activeBackgroundColor : props.$backgroundColor)};

  border-radius: ${(props) => {
    if (props.$isFirst && props.$isLast) return `${props.$borderRadius}px`;
    if (props.$isFirst) return `${props.$borderRadius}px 0 0 ${props.$borderRadius}px`;
    if (props.$isLast) return `0 ${props.$borderRadius}px ${props.$borderRadius}px 0`;
    return "0";
  }};

  border: ${(props) => (props.$isFirst || props.$isLast ? "none" : "1px solid rgba(255, 255, 255, 0.5)")};

  box-shadow:
    0px 22.862px 26.389px -20.902px rgba(238, 238, 238, 0.6) inset,
    0px 3.266px 3.919px -1.96px rgba(255, 255, 255, 0.6) inset,
    0px 57.481px 45.985px -31.354px rgba(51, 65, 69, 0.1) inset,
    0px 2.613px 11.758px 0px rgba(212, 212, 212, 0.3) inset,
    0px 0.653px 13.064px 0px rgba(212, 212, 212, 0.2) inset;
  backdrop-filter: blur(32.65992736816406px);
`;

const ProgressLine = styled.div<{
  $position: number;
  $width: number;
  $height: number;
  $color: string;
}>`
  position: absolute;
  left: ${(props) => props.$position - props.$width / 2}px;
  top: -6px;
  width: ${(props) => props.$width}px;
  height: ${(props) => props.$height + 12}px;
  background-color: ${(props) => props.$color};
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.4);
  border-radius: 50px;
  z-index: 10;
`;

const SegmentLabelsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  display: flex;
  margin-top: 12px;
`;

const SegmentLabel = styled(Text).attrs<{ $isActive: boolean }>(({ $isActive }) => ({
  size: "xs",
  weight: "medium",
  noMargin: true,
  variant: $isActive ? "primary" : "tertiary",
}))<{
  $position: number;
  $width: number;
  $isActive: boolean;
}>`
  position: absolute;
  left: ${(props) => props.$position - 8}px;
  width: ${(props) => props.$width}px;
  text-align: left;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
