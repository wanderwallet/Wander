import { TierTypes } from "~utils/tier/constants";
import { useActiveTier } from "~utils/tier/hooks";

interface WanderFeeTagProps {
  style?: React.CSSProperties;
}

const TIER_CONFIGS = {
  [TierTypes.Core]: {
    backgroundColor: "#242426",
    filterColor: "#000",
    gradient: {
      start: "#fff",
      middle: "#fff",
      end: "#C3A1FF",
    },
    filterColors: {
      shadow1: "0 0 0 0 0.418824 0 0 0 0 0.341176 0 0 0 0 0.975686 0 0 0 0.2 0",
      shadow2: "0 0 0 0 0.149020 0 0 0 0 0.071765 0 0 0 0 0.435294 0 0 0 0.3 0",
      shadow3: "0 0 0 0 0.764706 0 0 0 0 0.630588 0 0 0 0 1 0 0 0 0.1 0",
      shadow5: "0 0 0 0 0.418824 0 0 0 0 0.341176 0 0 0 0 0.975686 0 0 0 0.6 0",
    },
  },
  [TierTypes.Reserve]: {
    backgroundColor: "#242426",
    filterColor: "#000",
    gradient: {
      start: "#fff",
      middle: "#fff",
      end: "#89CBBB",
    },
    filterColors: {
      shadow1: "0 0 0 0 0.52549 0 0 0 0 0.898039 0 0 0 0 0.662745 0 0 0 0.2 0",
      shadow2: "0 0 0 0 0.0317014 0 0 0 0 0.230652 0 0 0 0 0.345833 0 0 0 0.3 0",
      shadow3: "0 0 0 0 0.827451 0 0 0 0 1 0 0 0 0 0.827451 0 0 0 0.1 0",
      shadow5: "0 0 0 0 0.52549 0 0 0 0 0.898039 0 0 0 0 0.662745 0 0 0 0.6 0",
    },
  },
  [TierTypes.Select]: {
    backgroundColor: "#242426",
    filterColor: "#000",
    gradient: {
      start: "#fff",
      middle: "#fff",
      end: "#89B3CB",
    },
    filterColors: {
      shadow1: "0 0 0 0 0.0507812 0 0 0 0 0.533203 0 0 0 0 0.8125 0 0 0 0.2 0",
      shadow2: "0 0 0 0 0.0317014 0 0 0 0 0.230652 0 0 0 0 0.345833 0 0 0 0.3 0",
      shadow3: "0 0 0 0 0.513726 0 0 0 0 0.843137 0 0 0 0 0.960784 0 0 0 0.1 0",
      shadow5: "0 0 0 0 0.513726 0 0 0 0 0.843137 0 0 0 0 0.960784 0 0 0 0.6 0",
    },
  },
  [TierTypes.Edge]: {
    backgroundColor: "#242426",
    filterColor: "#000",
    gradient: {
      start: "#989696",
      middle: "#ffffff",
      end: "#5E5E5E",
    },
    filterColors: {
      shadow1: "0 0 0 0 0.831373 0 0 0 0 0.831373 0 0 0 0 0.831373 0 0 0 0.2 0",
      shadow2: "0 0 0 0 0.831373 0 0 0 0 0.831373 0 0 0 0 0.831373 0 0 0 0.3 0",
      shadow3: "0 0 0 0 0.20087 0 0 0 0 0.256652 0 0 0 0 0.269174 0 0 0 0.1 0",
      shadow5: "0 0 0 0 0.931997 0 0 0 0 0.931997 0 0 0 0 0.931997 0 0 0 0.6 0",
    },
  },
  [TierTypes.Prime]: {
    backgroundColor: "#242426",
    filterColor: "#000",
    gradient: {
      start: "#fff",
      middle: "#fff",
      end: "#FFDB97",
    },
    filterColors: {
      shadow1: "0 0 0 0 0.8125 0 0 0 0 0.62207 0 0 0 0 0.0507812 0 0 0 0.2 0",
      shadow2: "0 0 0 0 0.345833 0 0 0 0 0.2673 0 0 0 0 0.0317014 0 0 0 0.3 0",
      shadow3: "0 0 0 0 0.939866 0 0 0 0 0.904871 0 0 0 0 0.51992 0 0 0 0.1 0",
      shadow5: "0 0 0 0 1 0 0 0 0 0.891402 0 0 0 0 0.687782 0 0 0 0.6 0",
    },
  },
} as const;

export function WanderFeeTag({ style }: WanderFeeTagProps) {
  const { data: activeTier } = useActiveTier();
  const config = TIER_CONFIGS[activeTier?.tier ?? TierTypes.Core];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" fill="none" style={style}>
      <g clipPath="url(#clip0_1542_1657)">
        <rect width="18" height="18" x=".5" fill={config.backgroundColor} rx="4" />
        <foreignObject width="148.64" height="148.64" x="-64.82" y="-65.32">
          <div
            style={{
              backdropFilter: "blur(32.66px)",
              clipPath: "url(#bgblur_1_1542_1657_clip_path)",
              height: "100%",
              width: "100%",
            }}
          />
        </foreignObject>
        <g data-figma-bg-blur-radius="65.32" filter="url(#filter0_iiiii_1542_1657)">
          <path fill={config.filterColor} d="M.5 0h18v18H.5z" />
        </g>
        <path
          fill="url(#paint0_linear_1542_1657)"
          d="M2.513 7.137a.134.134 0 0 1 .189-.172l3.8 2.185 2.47 2.783-3.917.629-2.542-5.425Zm13.785-.172a.134.134 0 0 1 .19.172l-2.543 5.425-3.918-.63 2.47-2.782 3.801-2.185Zm-6.951-.864c.113-.147.216-.125.322.012l2.5 3.171-2.432 2.186-.235-5.02-.236 5.02L6.842 9.28l2.505-3.178Z"
        />
      </g>
      <rect width="17.5" height="17.5" x=".75" y=".25" stroke="#333" strokeWidth=".5" rx="3.75" />
      <defs>
        <clipPath id="bgblur_1_1542_1657_clip_path" transform="translate(64.82 65.32)">
          <path d="M.5 0h18v18H.5z" />
        </clipPath>
        <clipPath id="clip0_1542_1657">
          <rect width="18" height="18" x=".5" fill="#fff" rx="4" />
        </clipPath>
        <linearGradient
          id="paint0_linear_1542_1657"
          x1="15.507"
          x2="2.5"
          y1="5.056"
          y2="13.331"
          gradientUnits="userSpaceOnUse">
          <stop stopColor={config.gradient.start} />
          <stop offset=".5" stopColor={config.gradient.middle} />
          <stop offset="1" stopColor={config.gradient.end} />
        </linearGradient>
        <filter
          id="filter0_iiiii_1542_1657"
          width="148.64"
          height="148.64"
          x="-64.82"
          y="-65.32"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feOffset dy=".653" />
          <feGaussianBlur stdDeviation="6.532" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values={config.filterColors.shadow1} />
          <feBlend in2="shape" result="effect1_innerShadow" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feOffset dy="2.613" />
          <feGaussianBlur stdDeviation="5.879" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values={config.filterColors.shadow2} />
          <feBlend in2="effect1_innerShadow" result="effect2_innerShadow" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="31.354" result="effect3_innerShadow" />
          <feOffset dy="57.481" />
          <feGaussianBlur stdDeviation="22.993" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values={config.filterColors.shadow3} />
          <feBlend in2="effect2_innerShadow" result="effect3_innerShadow" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.96" result="effect4_innerShadow" />
          <feOffset dy="3.266" />
          <feGaussianBlur stdDeviation="1.96" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0" />
          <feBlend in2="effect3_innerShadow" mode="plus-lighter" result="effect4_innerShadow" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="20.902" result="effect5_innerShadow" />
          <feOffset dy="22.862" />
          <feGaussianBlur stdDeviation="13.195" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values={config.filterColors.shadow5} />
          <feBlend in2="effect4_innerShadow" result="effect5_innerShadow" />
        </filter>
      </defs>
    </svg>
  );
}
