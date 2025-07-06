import type { Tier } from "~utils/tier/types";
import browser from "webextension-polyfill";
import coreCarouselBg from "~assets/images/tier/core_carousel_bg.png";
import selectCarouselBg from "~assets/images/tier/select_carousel_bg.png";
import plusCarouselBg from "~assets/images/tier/plus_carousel_bg.png";
import primeCarouselBg from "~assets/images/tier/prime_carousel_bg.png";
import eliteCarouselBg from "~assets/images/tier/elite_carousel_bg.png";

import coreCarouselBgLight from "~assets/images/tier/core_carousel_bg_light.png";
import selectCarouselBgLight from "~assets/images/tier/select_carousel_bg_light.png";
import plusCarouselBgLight from "~assets/images/tier/plus_carousel_bg_light.png";
import primeCarouselBgLight from "~assets/images/tier/prime_carousel_bg_light.png";
import eliteCarouselBgLight from "~assets/images/tier/elite_carousel_bg_light.png";

export interface WandCarouselSlide {
  tierName: Tier;
  tierTitle?: string;
  tierDescription?: string;
  tierBenefits: string[];
  carouselBg: string;
  carouselBgLight: string;
}

export const carouselData: WandCarouselSlide[] = [
  {
    tierName: "Core",
    tierTitle: browser.i18n.getMessage("tier_core_title"),
    tierDescription: browser.i18n.getMessage("tier_core_description"),
    tierBenefits: [],
    carouselBg: coreCarouselBg,
    carouselBgLight: coreCarouselBgLight,
  },
  {
    tierName: "Select",
    tierBenefits: [browser.i18n.getMessage("tier_benefit_fee_reduction_defi", "5")],
    carouselBg: selectCarouselBg,
    carouselBgLight: selectCarouselBgLight,
  },
  {
    tierName: "Reserve",
    tierBenefits: [
      browser.i18n.getMessage("tier_benefit_fee_reduction_defi", "25"),
      browser.i18n.getMessage("tier_benefit_access_features", browser.i18n.getMessage("tier_feature_type_reserve")),
    ],
    carouselBg: plusCarouselBg,
    carouselBgLight: plusCarouselBgLight,
  },
  {
    tierName: "Edge",
    tierBenefits: [
      browser.i18n.getMessage("tier_benefit_fee_reduction_defi", "75"),
      browser.i18n.getMessage("tier_benefit_fee_reduction_transak", "100"),
      browser.i18n.getMessage("tier_benefit_access_features", browser.i18n.getMessage("tier_feature_type_edge")),
      browser.i18n.getMessage("tier_benefit_early_access"),
      browser.i18n.getMessage("tier_benefit_support_channels", browser.i18n.getMessage("tier_support_channels_basic")),
    ],
    carouselBg: primeCarouselBg,
    carouselBgLight: primeCarouselBgLight,
  },
  {
    tierName: "Prime",
    tierBenefits: [
      browser.i18n.getMessage("tier_benefit_fee_reduction_defi", "100"),
      browser.i18n.getMessage("tier_benefit_fee_reduction_transak", "100"),
      browser.i18n.getMessage("tier_benefit_access_features", browser.i18n.getMessage("tier_feature_type_all")),
      browser.i18n.getMessage("tier_benefit_early_access"),
      browser.i18n.getMessage(
        "tier_benefit_support_channels",
        browser.i18n.getMessage("tier_support_channels_premium"),
      ),
    ],
    carouselBg: eliteCarouselBg,
    carouselBgLight: eliteCarouselBgLight,
  },
];
