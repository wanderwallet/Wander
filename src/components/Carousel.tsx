import React, { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styled from "styled-components";
import type { EmblaOptionsType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "@untitled-ui/icons-react";

export interface CarouselSlide {
  [key: string]: any;
}

export interface CarouselProps<T extends CarouselSlide = CarouselSlide> {
  slides: T[];
  renderSlide: (slide: T, index: number) => React.ReactNode;
  options?: EmblaOptionsType;
  showDots?: boolean;
  dotColor?: string;
  activeDotColor?: string;
  showChevrons?: boolean;
  chevronColor?: string;
  chevronActiveColor?: string;
  chevronSize?: number;
  onSlideChange?: (index: number) => void;
  className?: string;
  containerStyle?: React.CSSProperties;
}

export function Carousel<T extends CarouselSlide = CarouselSlide>({
  slides,
  renderSlide,
  options = {
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
    containScroll: "trimSnaps",
  },
  showDots = true,
  dotColor = "rgba(255, 255, 255, 0.4)",
  activeDotColor = "white",
  showChevrons = false,
  chevronColor = "rgba(255, 255, 255, 0.6)",
  chevronActiveColor = "white",
  chevronSize = 24,
  onSlideChange,
  className,
  containerStyle,
}: CarouselProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    onSlideChange?.(index);
  }, [emblaApi, onSlideChange]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const canScrollPrev = useCallback(() => emblaApi?.canScrollPrev() ?? false, [emblaApi]);
  const canScrollNext = useCallback(() => emblaApi?.canScrollNext() ?? false, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <CarouselContainer className={className} style={containerStyle}>
      <EmblaViewport ref={emblaRef}>
        <EmblaContainer>
          {slides.map((slide, index) => (
            <EmblaSlide key={`slide-${index}`}>{renderSlide(slide, index)}</EmblaSlide>
          ))}
        </EmblaContainer>
      </EmblaViewport>

      {showDots && slides.length > 1 && (
        <NavigationContainer showChevrons={showChevrons}>
          {showChevrons && (
            <ChevronButton
              onClick={scrollPrev}
              disabled={!canScrollPrev()}
              chevronColor={chevronColor}
              chevronActiveColor={chevronActiveColor}
              size={chevronSize}>
              <ChevronLeftIcon size={chevronSize} />
            </ChevronButton>
          )}

          <DotsContainer>
            {slides.map((_, index) => (
              <Dot
                key={`dot-${index}`}
                active={index === selectedIndex}
                dotColor={dotColor}
                activeDotColor={activeDotColor}
                onClick={() => scrollTo(index)}
              />
            ))}
          </DotsContainer>

          {showChevrons && (
            <ChevronButton
              onClick={scrollNext}
              disabled={!canScrollNext()}
              chevronColor={chevronColor}
              chevronActiveColor={chevronActiveColor}
              size={chevronSize}>
              <ChevronRightIcon size={chevronSize} />
            </ChevronButton>
          )}
        </NavigationContainer>
      )}
    </CarouselContainer>
  );
}

const CarouselContainer = styled.div`
  width: 100%;
`;

const EmblaViewport = styled.div`
  overflow: hidden;
`;

const EmblaContainer = styled.div`
  display: flex;
  touch-action: pan-y pinch-zoom;
  gap: 16px;
`;

const EmblaSlide = styled.div`
  flex: 0 0 100%;
  min-width: 0;
`;

const NavigationContainer = styled.div<{ showChevrons: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.showChevrons ? "space-between" : "center")};
  margin-top: 20px;
  gap: 16px;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const Dot = styled.button<{
  active: boolean;
  dotColor: string;
  activeDotColor: string;
}>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: ${(props) => (props.active ? props.activeDotColor : props.dotColor)};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.active
        ? props.activeDotColor
        : props.dotColor.replace("0.4)", "0.6)").replace("rgba(255, 255, 255, 0.4)", "rgba(255, 255, 255, 0.6)")};
  }
`;

const ChevronButton = styled.button<{
  chevronColor: string;
  chevronActiveColor: string;
  size: number;
}>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => props.chevronColor};
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;

  &:hover:not(:disabled) {
    color: ${(props) => props.chevronActiveColor};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const ChevronLeftIcon = styled(ChevronLeft)<{ size: number }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
`;

const ChevronRightIcon = styled(ChevronRight)<{ size: number }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
`;
