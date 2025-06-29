import { Button, Text } from "@arconnect/components-rebrand";
import { ExtensionStorage } from "~utils/storage";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import wandAnnouncementBackground from "~assets/images/wand-announcement/wand_announcement_bg.svg";
import powerups from "~assets/images/wand-announcement/powerups.png";
import exclusiveFeature from "~assets/images/wand-announcement/exclusive_feature.png";
import zeroFees from "~assets/images/wand-announcement/zero_fees.png";
import wand from "~assets/images/wand-announcement/wand.png";

const carouselData = [
  {
    image: wand,
    title: "Swipe to learn more",
  },
  {
    image: zeroFees,
    title: "Zero fees",
  },
  {
    image: exclusiveFeature,
    title: "Exclusive feature access",
  },
  {
    image: powerups,
    title: "Power-ups with partners",
  },
];

export const WandAnnouncementPopup = ({ isOpen, setOpen }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  async function handleClose() {
    setOpen(false);
    await ExtensionStorage.set("wand_announcement_shown", true);
  }

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <SliderMenu
      isOpen={isOpen}
      onClose={handleClose}
      style={{
        backgroundImage: `url(${wandAnnouncementBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "24px",
        boxSizing: "border-box",
      }}
      fullscreen>
      <Flex direction="column" justify="space-between" height="100%">
        <Flex direction="column" width="100%">
          <Flex direction="column" gap={8} align="center" justify="center">
            <Text size="sm" weight="semibold" noMargin>
              Introducing the
            </Text>
            <Flex gap={4} justify="center" align="flex-end">
              <Text
                size="3xl"
                weight="semibold"
                style={{
                  background: "linear-gradient(89deg, #7461FA -3.24%, #8B7AFD 98.77%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                noMargin>
                WAND
              </Text>
              <Text size="3xl" weight="semibold" noMargin>
                token!
              </Text>
            </Flex>
          </Flex>
          <CarouselContainer>
            <EmblaViewport ref={emblaRef}>
              <EmblaContainer>
                {carouselData.map((item, index) => (
                  <EmblaSlide key={index}>
                    <CarouselImage src={item.image} alt={item.title} />
                    <Text weight="semibold" noMargin>
                      {item.title}
                    </Text>
                  </EmblaSlide>
                ))}
              </EmblaContainer>
            </EmblaViewport>

            <DotsContainer>
              {carouselData.map((_, index) => (
                <Dot key={index} active={index === selectedIndex} onClick={() => scrollTo(index)} />
              ))}
            </DotsContainer>
          </CarouselContainer>
        </Flex>

        <Flex direction="column" width="100%">
          <Button
            fullWidth
            onClick={() => {
              browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" });
            }}>
            Get WAND tokens
          </Button>
          <LinkButton fullWidth onClick={() => {}}>
            Explore tier benefits
          </LinkButton>
        </Flex>
      </Flex>
    </SliderMenu>
  );
};

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const CarouselImage = styled.img`
  width: 100%;
  height: 100%;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
`;

const Dot = styled.button<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: ${(props) => (props.active ? "white" : "rgba(255, 255, 255, 0.4)")};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => (props.active ? "white" : "rgba(255, 255, 255, 0.6)")};
  }
`;

const LinkButton = styled(Button)`
  background: none;
  border: none;
  transition: all 0.2s ease;
  &:hover {
    background: none;
    opacity: 0.8;
  }
`;
