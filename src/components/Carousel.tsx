import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  showNavigationArrows?: boolean;
  navigationArrowColor?: string;
  navigationArrowActiveColor?: string;
  navigationArrowSize?: number;
  navigationArrowPosition?: "withDots" | "onSlides";
  navigationLeftArrowIcon?: typeof ChevronLeft;
  navigationRightArrowIcon?: typeof ChevronLeft;
  showNavigationArrowsOnHover?: boolean;
  slideGap?: number;
  onSlideChange?: (index: number) => void;
  className?: string;
  containerStyle?: React.CSSProperties;
  slideNavigationGap?: number;
  showSlideEdges?: boolean;
}

export function Carousel<T extends CarouselSlide = CarouselSlide>({
  slides,
  renderSlide,
  options,
  showDots = true,
  showNavigationArrows = false,
  navigationArrowColor,
  navigationArrowActiveColor,
  navigationArrowSize = 24,
  navigationArrowPosition = "withDots",
  navigationLeftArrowIcon,
  navigationRightArrowIcon,
  showNavigationArrowsOnHover = false,
  onSlideChange,
  className,
  containerStyle,
  dotColor,
  activeDotColor,
  slideNavigationGap = 20,
  slideGap = 8,
  showSlideEdges = false,
}: CarouselProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const mergedOptions = useMemo<EmblaOptionsType>(
    () => ({
      loop: true,
      align: "center",
      skipSnaps: false,
      dragFree: false,
      containScroll: options?.loop === false ? false : "trimSnaps",
      speed: 10,
      watchDrag: true,
      watchResize: true,
      ...(options || {}),
    }),
    [options],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(mergedOptions);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    setCanScrollPrevious(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    onSlideChange?.(index);
  }, [emblaApi, onSlideChange]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <FullWidthContainer showSlideEdges={showSlideEdges}>
      <CarouselContainer className={className} style={containerStyle} slideNavigationGap={slideNavigationGap}>
        <CarouselViewportContainer $showNavigationArrowsOnHover={showNavigationArrowsOnHover}>
          <EmblaViewport ref={emblaRef}>
            <EmblaContainer slideGap={slideGap} showSlideEdges={showSlideEdges}>
              {slides.map((slide, index) => (
                <EmblaSlide key={`slide-${index}`}>{renderSlide(slide, index)}</EmblaSlide>
              ))}
            </EmblaContainer>
          </EmblaViewport>

          {showNavigationArrows && navigationArrowPosition === "onSlides" && (
            <>
              <OverlayNavigationArrowButton
                position="left"
                onClick={scrollPrev}
                disabled={!canScrollPrevious}
                size={navigationArrowSize}
                color={navigationArrowColor}
                activeColor={navigationArrowActiveColor}>
                <ChevronLeftIcon as={navigationLeftArrowIcon} size={navigationArrowSize} color={navigationArrowColor} />
              </OverlayNavigationArrowButton>
              <OverlayNavigationArrowButton
                position="right"
                onClick={scrollNext}
                disabled={!canScrollNext}
                size={navigationArrowSize}
                color={navigationArrowColor}
                activeColor={navigationArrowActiveColor}>
                <ChevronRightIcon
                  as={navigationRightArrowIcon}
                  size={navigationArrowSize}
                  color={navigationArrowColor}
                />
              </OverlayNavigationArrowButton>
            </>
          )}
        </CarouselViewportContainer>

        {showDots && slides.length > 1 && (
          <NavigationContainer showNavigationArrows={showNavigationArrows && navigationArrowPosition === "withDots"}>
            {showNavigationArrows && navigationArrowPosition === "withDots" && (
              <NavigationArrowButton
                onClick={scrollPrev}
                disabled={!canScrollPrevious}
                size={navigationArrowSize}
                color={navigationArrowColor}
                activeColor={navigationArrowActiveColor}>
                <ChevronLeftIcon as={navigationLeftArrowIcon} size={navigationArrowSize} color={navigationArrowColor} />
              </NavigationArrowButton>
            )}

            <DotsContainer>
              {slides.map((_, index) => (
                <Dot
                  key={`dot-${index}`}
                  active={index === selectedIndex}
                  onClick={() => scrollTo(index)}
                  dotColor={dotColor}
                  activeDotColor={activeDotColor}
                />
              ))}
            </DotsContainer>

            {showNavigationArrows && navigationArrowPosition === "withDots" && (
              <NavigationArrowButton
                onClick={scrollNext}
                disabled={!canScrollNext}
                size={navigationArrowSize}
                color={navigationArrowColor}
                activeColor={navigationArrowActiveColor}>
                <ChevronRightIcon
                  as={navigationRightArrowIcon}
                  size={navigationArrowSize}
                  color={navigationArrowColor}
                />
              </NavigationArrowButton>
            )}
          </NavigationContainer>
        )}
      </CarouselContainer>
    </FullWidthContainer>
  );
}

const CarouselContainer = styled.div<{ slideNavigationGap?: number }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: ${(props) => props.slideNavigationGap}px;
`;

const CarouselViewportContainer = styled.div<{ $showNavigationArrowsOnHover?: boolean }>`
  position: relative;

  ${(props) =>
    props.$showNavigationArrowsOnHover &&
    `
    & > button {
      opacity: 0;
      pointer-events: none;
    }

    &:hover > button {
      opacity: 1;
      pointer-events: auto;
    }

    & > button:disabled {
      opacity: 0;
      pointer-events: none;
    }
  `}
`;

const EmblaViewport = styled.div`
  overflow: hidden;
`;

const EmblaContainer = styled.div<{
  slideGap?: number;
  showSlideEdges?: boolean;
}>`
  display: flex;
  touch-action: pan-y pinch-zoom;
  gap: ${(props) => props.slideGap}px;
  ${(props) => props.showSlideEdges && `padding-left: 24px; padding-right: 24px;`}
`;

const EmblaSlide = styled.div`
  flex: 0 0 100%;
  min-width: 0;
  position: relative;
`;

const NavigationContainer = styled.div<{ showNavigationArrows: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.showNavigationArrows ? "space-between" : "center")};
  gap: 16px;
  padding-left: 24px;
  padding-right: 24px;
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
  background: ${(props) =>
    props.active ? props.activeDotColor || props.theme.primaryText : props.dotColor || props.theme.tertiaryText};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => props.activeDotColor || props.theme.primaryText};
  }
`;

const NavigationArrowButton = styled.button<{
  size: number;
  color?: string;
  activeColor?: string;
}>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => props.color || props.theme.secondaryText};
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    color: ${(props) => props.activeColor || props.theme.primaryText};
  }

  &:disabled {
    opacity: 0;
    cursor: default;
  }
`;

const OverlayNavigationArrowButton = styled.button<{
  position: "left" | "right";
  size: number;
  color?: string;
  activeColor?: string;
  showSlideEdges?: boolean;
}>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(props) => props.position}: -16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.001);
  border: none;
  border-radius: 50%;
  width: ${(props) => props.size + 8}px;
  height: ${(props) => props.size + 8}px;
  cursor: pointer;
  color: ${(props) => props.color || props.theme.secondaryText};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  ${(props) => props.showSlideEdges && `margin-left: 24px; margin-right: 24px;`}

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: ${(props) => props.activeColor || props.theme.primaryText};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0;
    cursor: default;
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

const FullWidthContainer = styled.div<{ showSlideEdges?: boolean }>`
  margin: 0 ${(props) => (props.showSlideEdges ? "-24px" : "0")};
`;
