import React, { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styled from "styled-components";
import type { EmblaOptionsType } from "embla-carousel";

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
            <EmblaSlide key={index}>{renderSlide(slide, index)}</EmblaSlide>
          ))}
        </EmblaContainer>
      </EmblaViewport>

      {showDots && slides.length > 1 && (
        <DotsContainer>
          {slides.map((_, index) => (
            <Dot
              key={index}
              active={index === selectedIndex}
              dotColor={dotColor}
              activeDotColor={activeDotColor}
              onClick={() => scrollTo(index)}
            />
          ))}
        </DotsContainer>
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
`;

const EmblaSlide = styled.div`
  flex: 0 0 100%;
  min-width: 0;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
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
