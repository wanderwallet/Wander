import type { DisplayTheme } from "@arconnect/components";
import { CloseIcon } from "@iconicicons/react";
import { Quantity } from "ao-tokens";
import { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { Id } from "~tokens/aoTokens/ao";
import { AO_NATIVE_TOKEN_BALANCE_MIRROR } from "~utils/ao_import";
import { ExtensionStorage } from "~utils/storage";
import { useAo } from "~tokens/hooks";

interface AoBannerProps {
  activeAddress: string;
}

export default function AoBanner({ activeAddress }: AoBannerProps) {
  const ao = useAo();
  const theme = useTheme();
  const [showBanner, setShowBanner] = useState(false);

  async function getAoNativeTokenBalance() {
    const res = await ao.dryrun({
      Id,
      Owner: activeAddress,
      process: AO_NATIVE_TOKEN_BALANCE_MIRROR,
      tags: [{ name: "Action", value: "Balance" }],
    });

    const balance = res.Messages[0].Data;

    if (balance) {
      return new Quantity(BigInt(balance), BigInt(12));
    }

    return new Quantity(0, BigInt(12));
  }

  async function hideBanner() {
    setShowBanner(false);
    await ExtensionStorage.set(`ao_hide_banner_${activeAddress}`, true);
  }

  async function fetchAoNativeTokenBalance() {
    const balance = await getAoNativeTokenBalance();
    setShowBanner(balance.toNumber() > 0);
  }

  useEffect(() => {
    if (activeAddress && ao) {
      ExtensionStorage.get(`ao_hide_banner_${activeAddress}`).then((hideBanner) => {
        if (!hideBanner) {
          fetchAoNativeTokenBalance().catch(() => {});
        } else {
          setShowBanner(false);
        }
      });
    }
  }, [activeAddress, ao]);

  if (!activeAddress || !showBanner) {
    return null;
  }

  return (
    <Banner displayTheme={theme.displayTheme} show={showBanner}>
      <BannerVector />
      <Close onClick={hideBanner} />
      <h4>{browser.i18n.getMessage("ao_token_announcement_title")}</h4>
    </Banner>
  );
}

function BannerVector() {
  return (
    <BannerVectorWrapper>
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 378 40" fill="none">
        <g style={{ mixBlendMode: "color-dodge" }} opacity="0.5" filter="url(#filter0_f_8_50)">
          <path
            d="M190 21C65.2 2.2 0.666666 36.1667 -16 55.5H395V-9C378.667 8.83334 314.8 39.8 190 21Z"
            fill="url(#paint0_radial_8_50)"
          />
        </g>
        <defs>
          <filter
            id="filter0_f_8_50"
            x="-24"
            y="-17"
            width="427"
            height="80.5"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="4" result="effect1_foregroundBlur_8_50" />
          </filter>
          <radialGradient
            id="paint0_radial_8_50"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(-16 -9) rotate(8.91893) scale(416.03 608.898)">
            <stop offset="0.141974" stopColor="#544A81" />
            <stop offset="0.226901" stopColor="#8E7BEA" />
            <stop offset="0.587079" stopColor="#544A81" />
            <stop offset="1" stopColor="#8E7BEA" />
          </radialGradient>
        </defs>
      </svg>
    </BannerVectorWrapper>
  );
}

const Banner = styled.div<{ displayTheme: DisplayTheme; show: boolean }>`
  display: flex;
  padding: 0.75rem;
  position: relative;
  flex-direction: row;
  color: #ffffff;
  overflow: hidden;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%),
    radial-gradient(945.06% 141.42% at 0% 0%, #8e7bea 0%, #544a81 41.29%, #8e7bea 77.31%, #544a81 85.8%);
  border-bottom: 2px solid #8e7bea;
  justify-content: center;
  align-items: center;
  gap: 8px;
  h4 {
    font-weight: 500;
    font-size: 0.8rem !important;
    margin: 0;
    padding: 0;
    font-size: inherit;
  }
`;

const BannerVectorWrapper = styled.div`
  height: 70px;
  width: 100%;
  position: absolute;
  right: -17px;
  bottom: -15.5px;
`;

const Close = styled(CloseIcon)`
  z-index: 1;
  font-size: 1.3rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.95) translateY(-50%);
  }
`;
