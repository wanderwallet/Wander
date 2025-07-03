import type { Tier } from "~utils/tier/types";
import coreCarouselBg from "~assets/images/tier/core_carousel_bg.png";
import selectCarouselBg from "~assets/images/tier/select_carousel_bg.png";
import plusCarouselBg from "~assets/images/tier/plus_carousel_bg.png";
import primeCarouselBg from "~assets/images/tier/prime_carousel_bg.png";
import eliteCarouselBg from "~assets/images/tier/elite_carousel_bg.png";

interface WandCarouselSlide {
  tierName: Tier;
  tierBenefits: string[];
  carouselBg: string;
}

export const carouselData: WandCarouselSlide[] = [
  {
    tierName: "Core",
    tierBenefits: ["Wander as you know it"],
    carouselBg: coreCarouselBg,
  },
  {
    tierName: "Select",
    tierBenefits: ["5% fee reduction on defi transactions", "0% fee reduction on Transak purchases"],
    carouselBg: selectCarouselBg,
  },
  {
    tierName: "Plus",
    tierBenefits: [
      "25% fee reduction on defi transactions",
      "0% fee reduction on Transak purchases",
      "Access to Plus features",
    ],
    carouselBg: plusCarouselBg,
  },
  {
    tierName: "Prime",
    tierBenefits: [
      "75% fee reduction on defi transactions",
      "100% fee reduction on Transak purchases",
      "Access to Ultra features",
      "Early access to new features",
      "Dedicated support channel of their choice: Discord, Slack, Telegram, or Email",
    ],
    carouselBg: primeCarouselBg,
  },
  {
    tierName: "Elite",
    tierBenefits: [
      "100% fee reduction on defi transactions",
      "100% fee reduction on Transak purchases",
      "Access to ALL features",
      "Early access to new features",
      "Dedicated support channel of their choice: Discord, Slack, Telegram, Email, or schedule a video call with the team",
    ],
    carouselBg: eliteCarouselBg,
  },
];
