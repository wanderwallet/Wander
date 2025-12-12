import React, { useCallback, forwardRef } from "react";
import styled from "styled-components";
import { Text } from "@wanderapp/components";
import throttle from "lodash/throttle";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  showLabels?: boolean;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: number) => void;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      min = 0,
      max = 100,
      step = 1,
      showLabels = true,
      minLabel,
      maxLabel,
      disabled = false,
      className,
      onChange,
    },
    ref,
  ) => {
    const throttledOnChange = useCallback(
      throttle((value: number) => onChange?.(value), 16),
      [onChange],
    );

    const handleSliderChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(event.target.value);
        throttledOnChange(newValue);
      },
      [throttledOnChange],
    );

    return (
      <SliderContainer className={className}>
        <SliderWrapper>
          {showLabels && (
            <SliderLabel position="left">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                {minLabel || min}
              </Text>
            </SliderLabel>
          )}
          <SliderTrackContainer>
            <SliderInput
              ref={ref}
              type="range"
              min={min}
              max={max}
              step={step}
              defaultValue={value}
              onChange={handleSliderChange}
              disabled={disabled}
            />
            <SliderTrack>
              <SliderFill value={value} />
              <SliderThumb value={value} />
            </SliderTrack>
          </SliderTrackContainer>
          {showLabels && (
            <SliderLabel position="right">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                {maxLabel || max}
              </Text>
            </SliderLabel>
          )}
        </SliderWrapper>
      </SliderContainer>
    );
  },
);

const SliderContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SliderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const SliderTrackContainer = styled.div`
  position: relative;
  flex: 1;
`;

const SliderLabel = styled.div<{ position: "left" | "right" }>`
  display: flex;
  align-items: center;
  justify-content: ${({ position }) => (position === "left" ? "flex-start" : "flex-end")};
`;

const SliderInput = styled.input`
  position: absolute;
  width: 100%;
  height: 40px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);

  &:disabled {
    cursor: not-allowed;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    cursor: pointer;
    border: none;
    background: transparent;
  }

  &:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  &:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }
`;

const SliderTrack = styled.div`
  position: relative;
  width: 100%;
  height: 6px;
  background-color: ${({ theme }) => theme.surfaceSecondary};
  border-radius: 3px;
`;

const SliderFill = styled.div<{ value: number }>`
  position: absolute;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #5842f8 0%, #6b57f9 100%);
  border-radius: 3px;
  transform-origin: left;
  transform: scaleX(${({ value }) => value / 100});
  will-change: transform;
`;

const SliderThumb = styled.div<{ value: number }>`
  position: absolute;
  left: ${({ value }) => value}%;
  top: 50%;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  will-change: transform;
  pointer-events: none;
`;
