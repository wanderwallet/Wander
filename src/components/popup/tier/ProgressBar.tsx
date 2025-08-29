import { Text } from "@arconnect/components-rebrand";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import type { ActiveTier, Tier } from "~utils/tier/types";
import { useActiveAddress } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";

interface ProgressSegment {
  activeBackgroundColor: string;
  backgroundColor: string;
  percentage: number; // 0-100, segments should add up to 100
  name: Tier;
}

interface ProgressSegmentWithData extends ProgressSegment {
  actualWidth: number;
  start: number;
  startPercentage: number;
  endPercentage: number;
  isCompletelyFilled: boolean;
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
  highlightTierLabel?: string;
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
  highlightTierLabel,
  width = 330,
  height = 16,
  borderRadius = 8,
  separatorWidth = 1,
  showProgressLine = true,
  progressLineColor = "#EEE",
  progressLineWidth = 4,
  showSegmentLabels = true,
}: ProgressBarProps) {
  const { back } = useLocation();
  const queryClient = useQueryClient();
  const activeAddress = useActiveAddress();

  const handleSegmentClicked = useCallback(
    async (segmentData: ProgressSegmentWithData) => {
      if (process.env.NODE_ENV !== "development") return;

      const currentTier = await ExtensionStorage.get<ActiveTier>(`active_tier_${activeAddress}`);

      if (segmentData.name !== currentTier.tier || currentTier.totalHolders !== -1) {
        // Select tier manually:

        const index = segments.findIndex(({ name }) => name === segmentData.name);
        const rank = segments.length - index;
        const progress = segmentData.startPercentage + (segmentData.endPercentage - segmentData.startPercentage) / 2;
        const balance = `${10 ** (18 + index)}`;
        const activeTier: ActiveTier = {
          tier: segmentData.name,
          balance,
          rank,
          progress,
          snapshotTimestamp: Date.now(),
          totalHolders: -1,
        };

        await ExtensionStorage.set(`active_tier_${activeAddress}`, activeTier);

        await queryClient.refetchQueries({
          queryKey: ["active-tier", activeAddress],
        });

        back();
      } else if (currentTier.totalHolders === -1) {
        // Reset tier to the real value:

        await ExtensionStorage.remove(`active_tier_${activeAddress}`);

        await queryClient.refetchQueries({
          queryKey: ["active-tier", activeAddress],
        });

        back();
      }
    },
    [queryClient, activeAddress, segments, back],
  );

  // Calculate dimensions
  const exactProgressWidth = (progress / 100) * width;

  const segmentData = useMemo(() => {
    const totalSeparatorWidth = (segments.length - 1) * separatorWidth;
    const availableWidth = width - totalSeparatorWidth;

    // Calculate segment positions and widths with cumulative percentage ranges
    let accumulatedPercentage = 0;
    let accumulatedWidth = 0;

    return segments.map((segment, index) => {
      // We adjust for rounding errors in the last one:
      const actualWidth =
        index === segments.length - 1
          ? availableWidth - accumulatedWidth
          : Math.round((segment.percentage / 100) * availableWidth);

      const start = accumulatedWidth;
      const startPercentage = accumulatedPercentage;
      const endPercentage = accumulatedPercentage + segment.percentage;

      // A segment is active if progress has entered its range
      // Special case: show first segment as active when progress is 0
      const isCompletelyFilled = progress > startPercentage || (progress === 0 && index === 0);

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
      } satisfies ProgressSegmentWithData;
    });
  }, [segments, separatorWidth, width, progress]);

  const activeSegment = segmentData.findLast((segment) => segment.isCompletelyFilled);

  return (
    <ProgressContainer $width={width}>
      <SegmentsContainer $height={height} $borderRadius={borderRadius}>
        {segmentData.map((segment, index) => (
          <Segment
            key={`segment-${index}`}
            $width={segment.actualWidth}
            $height={height}
            $backgroundColor={activeSegment?.backgroundColor}
            $isActive={segment.isCompletelyFilled}
            $activeBackgroundColor={activeSegment?.activeBackgroundColor}
            $isFirst={index === 0}
            $isLast={index === segments.length - 1}
            $borderRadius={borderRadius}
            onClick={() => handleSegmentClicked(segment)}
          />
        ))}
      </SegmentsContainer>

      {showSegmentLabels && (
        <SegmentLabelsContainer>
          {segmentData.map((segment, index) => (
            <SegmentLabel
              key={`label-${index}`}
              $position={segment.start}
              $width={segment.actualWidth}
              $isActive={segment.isCompletelyFilled || (highlightTierLabel && segment.name === highlightTierLabel)}>
              <SegmentLabelText
                $isHighlighted={highlightTierLabel && segment.name === highlightTierLabel}
                $hasHighlightedLabel={!!highlightTierLabel}>
                {segment.name}
              </SegmentLabelText>
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
  $width?: number;
}>`
  position: relative;
  width: ${(props) => (props.$width ? `${props.$width}px` : "100%")};
`;

const SegmentsContainer = styled.div<{
  $height: number;
  $borderRadius: number;
}>`
  display: flex;
  align-items: center;
  width: 100%;
  height: ${(props) => props.$height}px;
  overflow: hidden;
  border-radius: ${(props) => props.$borderRadius}px;
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

  box-sizing: border-box;
  border-left: ${(props) => (props.$isFirst ? "none" : "1px solid rgba(255, 255, 255, 0.5)")};

  box-shadow:
    0px 22.862px 26.389px -20.902px rgba(238, 238, 238, 0.6) inset,
    0px 3.266px 3.919px -1.96px rgba(255, 255, 255, 0.6) inset,
    0px 57.481px 45.985px -31.354px rgba(51, 65, 69, 0.1) inset,
    0px 2.613px 11.758px 0px rgba(212, 212, 212, 0.3) inset,
    0px 0.653px 13.064px 0px rgba(212, 212, 212, 0.2) inset;
  backdrop-filter: blur(32.65992736816406px);

  ${process.env.NODE_ENV === "development"
    ? `
    cursor: pointer;

    &:hover {
      background: magenta;
    }
  `
    : ""}

  &:last-child {
    flex: 1;
  }
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
  pointer-events: none;
`;

const SegmentLabelsContainer = styled.div`
  display: flex;
  width: 100%;
  margin-top: 12px;

  &:before {
    content: "\\200B";
  }
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
  position: relative;
  width: ${(props) => props.$width}px;

  &:last-child {
    flex: 1;
  }
`;

const SegmentLabelText = styled.span<{ $isHighlighted: boolean; $hasHighlightedLabel: boolean }>`
  position: absolute;
  top: ${({ $hasHighlightedLabel, $isHighlighted }) => ($hasHighlightedLabel && !$isHighlighted ? "2px" : "0")};
  left: 0;
  transform: translate(-40%, 0);
  white-space: nowrap;
  text-overflow: ellipsis;

  ${({ $isHighlighted }) =>
    $isHighlighted &&
    `
    top: -1px;
    height: 20px;
    width: 58px;
    border-radius: 4px;
    background: rgba(86, 201, 128, 0.30);
    display: flex;
    align-items: center;
    justify-content: center;
  `}
`;
