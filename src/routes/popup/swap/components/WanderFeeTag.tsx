interface WanderFeeTagProps {
  style?: React.CSSProperties;
}

export function WanderFeeTag({ style }: WanderFeeTagProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" fill="none" style={style}>
      <g clipPath="url(#a)">
        <rect width="18" height="18" x=".5" fill="#242426" rx="4" />
        <foreignObject width="148.64" height="148.64" x="-64.82" y="-65.32">
          <div
            style={{
              backdropFilter: "blur(32.66px)",
              clipPath: "url(#b)",
              height: "100%",
              width: "100%",
            }}
          />
        </foreignObject>
        <g data-figma-bg-blur-radius="65.32" filter="url(#c)">
          <path fill="#000" d="M.5 0h18v18H.5z" />
        </g>
        <path
          fill="url(#d)"
          d="M2.513 7.137a.134.134 0 0 1 .189-.172l3.8 2.185 2.47 2.783-3.917.629-2.542-5.425Zm13.785-.172a.134.134 0 0 1 .19.172l-2.543 5.425-3.918-.63 2.47-2.782 3.801-2.185Zm-6.951-.864c.113-.147.216-.125.322.012l2.5 3.171-2.432 2.186-.235-5.02-.236 5.02L6.842 9.28l2.505-3.178Z"
        />
      </g>
      <rect width="17.5" height="17.5" x=".75" y=".25" stroke="#333" strokeWidth=".5" rx="3.75" />
      <defs>
        <clipPath id="b" transform="translate(64.82 65.32)">
          <path d="M.5 0h18v18H.5z" />
        </clipPath>
        <clipPath id="a">
          <rect width="18" height="18" x=".5" fill="#fff" rx="4" />
        </clipPath>
        <linearGradient id="d" x1="15.507" x2="2.5" y1="5.056" y2="13.331" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" />
          <stop offset=".5" stopColor="#fff" />
          <stop offset="1" stopColor="#89B3CB" />
        </linearGradient>
        <filter
          id="c"
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
          <feColorMatrix values="0 0 0 0 0.0507812 0 0 0 0 0.533203 0 0 0 0 0.8125 0 0 0 0.2 0" />
          <feBlend in2="shape" result="effect1_innerShadow_1546_2125" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feOffset dy="2.613" />
          <feGaussianBlur stdDeviation="5.879" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0.0317014 0 0 0 0 0.230652 0 0 0 0 0.345833 0 0 0 0.3 0" />
          <feBlend in2="effect1_innerShadow_1546_2125" result="effect2_innerShadow_1546_2125" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="31.354" result="effect3_innerShadow_1546_2125" />
          <feOffset dy="57.481" />
          <feGaussianBlur stdDeviation="22.993" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0.513726 0 0 0 0 0.843137 0 0 0 0 0.960784 0 0 0 0.1 0" />
          <feBlend in2="effect2_innerShadow_1546_2125" result="effect3_innerShadow_1546_2125" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.96" result="effect4_innerShadow_1546_2125" />
          <feOffset dy="3.266" />
          <feGaussianBlur stdDeviation="1.96" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0" />
          <feBlend in2="effect3_innerShadow_1546_2125" mode="plus-lighter" result="effect4_innerShadow_1546_2125" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="20.902" result="effect5_innerShadow_1546_2125" />
          <feOffset dy="22.862" />
          <feGaussianBlur stdDeviation="13.195" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0.513726 0 0 0 0 0.843137 0 0 0 0 0.960784 0 0 0 0.6 0" />
          <feBlend in2="effect4_innerShadow_1546_2125" result="effect5_innerShadow_1546_2125" />
        </filter>
      </defs>
    </svg>
  );
}
