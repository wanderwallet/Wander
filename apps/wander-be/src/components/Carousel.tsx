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
  smoothSliding?: boolean;
  slideDuration?: number;
  slideEasing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" | string;
  onSlideChange?: (index: number) => void;
  className?: string;
  containerStyle?: React.CSSProperties;
  slideNavigationGap?: number;
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
  smoothSliding = true,
  slideDuration = 30,
  slideEasing = "cubic-bezier(0.4, 0, 0.2, 1)",
  onSlideChange,
  className,
  containerStyle,
  dotColor,
  activeDotColor,
  slideNavigationGap = 20,
}: CarouselProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNextward, setCanScrollNextward] = useState(false);

  const mergedOptions = useMemo<EmblaOptionsType>(
    () => ({
      loop: true,
      align: "center",
      skipSnaps: false,
      dragFree: false,
      containScroll: "trimSnaps",
      ...(smoothSliding && {
        duration: slideDuration,
        inViewThreshold: 0.7,
        watchDrag: true,
        watchResize: true,
      }),
      ...(options || {}),
    }),
    [smoothSliding, slideDuration, options],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(mergedOptions);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    setCanScrollPrevious(emblaApi.canScrollPrev());
    setCanScrollNextward(emblaApi.canScrollNext());
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
    <CarouselContainer className={className} style={containerStyle} slideNavigationGap={slideNavigationGap}>
      <CarouselViewportContainer $showNavigationArrowsOnHover={showNavigationArrowsOnHover}>
        <EmblaViewport ref={emblaRef} $smoothSliding={smoothSliding}>
          <EmblaContainer $smoothSliding={smoothSliding} $duration={slideDuration} $easing={slideEasing}>
            {slides.map((slide, index) => (
              <EmblaSlide key={`slide-${index}`} $smoothSliding={smoothSliding}>
                {renderSlide(slide, index)}
              </EmblaSlide>
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
              disabled={!canScrollNextward}
              size={navigationArrowSize}
              color={navigationArrowColor}
              activeColor={navigationArrowActiveColor}>
              <ChevronRightIcon as={navigationRightArrowIcon} size={navigationArrowSize} color={navigationArrowColor} />
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
              disabled={!canScrollNextward}
              size={navigationArrowSize}
              color={navigationArrowColor}
              activeColor={navigationArrowActiveColor}>
              <ChevronRightIcon as={navigationRightArrowIcon} size={navigationArrowSize} color={navigationArrowColor} />
            </NavigationArrowButton>
          )}
        </NavigationContainer>
      )}
    </CarouselContainer>
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

const EmblaViewport = styled.div<{ $smoothSliding?: boolean }>`
  overflow: hidden;
  ${(props) =>
    props.$smoothSliding &&
    `
    transform: translateZ(0);
    backface-visibility: hidden;
  `}
`;

const EmblaContainer = styled.div<{ $smoothSliding?: boolean; $duration?: number; $easing?: string }>`
  display: flex;
  touch-action: pan-y pinch-zoom;
  gap: 16px;
  ${(props) =>
    props.$smoothSliding &&
    `
    will-change: transform;
    backface-visibility: hidden;
    transition: transform ${props.$duration || 30}ms ${props.$easing || "cubic-bezier(0.4, 0, 0.2, 1)"};
    transform: translateZ(0);
  `}
`;

const EmblaSlide = styled.div<{ $smoothSliding?: boolean }>`
  flex: 0 0 100%;
  min-width: 0;
  ${(props) =>
    props.$smoothSliding &&
    `
    backface-visibility: hidden;
    transform: translateZ(0);
    will-change: transform;
  `}
`;

const NavigationContainer = styled.div<{ showNavigationArrows: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.showNavigationArrows ? "space-between" : "center")};
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
