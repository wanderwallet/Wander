import { useId } from "react";
import { useTheme } from "styled-components";
import { TierTypes } from "~utils/tier/constants";
import type { Tier } from "~utils/tier/types";

const colors = {
  light: {
    [TierTypes.Prime]: "#D5AA0F",
    [TierTypes.Edge]: "#A5A5A5",
    [TierTypes.Reserve]: "#56C980",
    [TierTypes.Select]: "#83D7F5",
    [TierTypes.Core]: "#9787FF",
  },
};

const CustomizableStars = ({
  color,
  width = 248,
  height = 58,
  className = "",
  style = {},
  tier,
}: {
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  tier?: Tier;
}) => {
  const filterId1 = useId();
  const filterId2 = useId();
  const filterId3 = useId();
  const filterId4 = useId();
  const filterId5 = useId();
  const filterId6 = useId();
  const filterId7 = useId();
  const filterId8 = useId();

  const theme = useTheme();
  let _color = theme.displayTheme === "dark" ? "#ffffff" : colors.light[tier ?? TierTypes.Core];

  if (color) {
    _color = color;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      style={style}
      viewBox="0 0 248 58"
      fill="none"
      className={className}>
      <g opacity="0.3" filter={`url(#${filterId1})`}>
        <path
          d="M183.257 2.14415C183.302 1.97677 183.539 1.97677 183.584 2.14415L184.68 6.26339C184.696 6.32172 184.741 6.36735 184.799 6.38309L188.893 7.4887C189.059 7.53369 189.059 7.77002 188.893 7.81501L184.799 8.92063C184.741 8.93637 184.696 8.98199 184.68 9.04032L183.584 13.1596C183.539 13.3269 183.302 13.3269 183.257 13.1596L182.161 9.04032C182.145 8.98199 182.1 8.93637 182.041 8.92063L177.948 7.81501C177.781 7.77002 177.781 7.53369 177.948 7.4887L182.041 6.38309C182.1 6.36735 182.145 6.32172 182.161 6.26339L183.257 2.14415Z"
          fill={_color}
        />
      </g>
      <g opacity="0.8" filter={`url(#${filterId2})`}>
        <path
          d="M69.0903 5.96702C69.1102 5.89127 69.2178 5.89127 69.2377 5.96702L69.7135 7.77236C69.7204 7.79869 69.7408 7.81932 69.7671 7.82648L71.5462 8.3118C71.6211 8.33223 71.6211 8.43847 71.5462 8.4589L69.7671 8.94422C69.7408 8.95138 69.7204 8.97201 69.7135 8.99834L69.2377 10.8037C69.2178 10.8794 69.1102 10.8794 69.0903 10.8037L68.6146 8.99834C68.6076 8.97201 68.5872 8.95138 68.5609 8.94422L66.7818 8.4589C66.7069 8.43847 66.7069 8.33223 66.7818 8.3118L68.5609 7.82648C68.5872 7.81932 68.6076 7.79869 68.6146 7.77236L69.0903 5.96702Z"
          fill={_color}
        />
      </g>
      <g opacity="0.1" filter={`url(#${filterId3})`}>
        <path
          d="M16.7449 1.35411C16.7895 1.18673 17.027 1.18673 17.0716 1.35411L18.8531 8.04783C18.8686 8.10616 18.9141 8.15178 18.9724 8.16752L25.6216 9.96337C25.7882 10.0084 25.7882 10.2447 25.6216 10.2897L18.9724 12.0855C18.9141 12.1013 18.8686 12.1469 18.8531 12.2052L17.0716 18.8989C17.027 19.0663 16.7895 19.0663 16.7449 18.8989L14.9634 12.2052C14.9479 12.1469 14.9024 12.1013 14.8442 12.0855L8.19492 10.2897C8.02834 10.2447 8.02834 10.0084 8.19492 9.96337L14.8442 8.16752C14.9024 8.15178 14.9479 8.10616 14.9634 8.04783L16.7449 1.35411Z"
          fill={_color}
        />
      </g>
      <g opacity="0.9" filter={`url(#${filterId4})`}>
        <path
          d="M203.396 24.2142C203.441 24.0463 203.679 24.0463 203.723 24.2142L204.778 28.2164C204.793 28.2747 204.839 28.3205 204.897 28.3363L208.841 29.4122C209.007 29.4575 209.007 29.693 208.841 29.7383L204.897 30.8142C204.839 30.8301 204.793 30.8758 204.778 30.9342L203.723 34.9364C203.679 35.1043 203.441 35.1043 203.396 34.9364L202.342 30.9342C202.326 30.8758 202.281 30.8301 202.223 30.8142L198.279 29.7383C198.113 29.693 198.113 29.4575 198.279 29.4122L202.223 28.3363C202.281 28.3205 202.326 28.2747 202.342 28.2164L203.396 24.2142Z"
          fill={_color}
        />
      </g>
      <g opacity="0.1" filter={`url(#${filterId5})`}>
        <path
          d="M238.773 38.8766C238.818 38.7092 239.055 38.7092 239.1 38.8766L240.539 44.2831C240.554 44.3414 240.6 44.387 240.658 44.4027L246.029 45.8535C246.196 45.8985 246.196 46.1348 246.029 46.1798L240.658 47.6305C240.6 47.6463 240.554 47.6919 240.539 47.7502L239.1 53.1567C239.055 53.3241 238.818 53.3241 238.773 53.1567L237.334 47.7502C237.318 47.6919 237.273 47.6463 237.215 47.6305L231.843 46.1798C231.677 46.1348 231.677 45.8985 231.843 45.8535L237.215 44.4027C237.273 44.387 237.318 44.3414 237.334 44.2831L238.773 38.8766Z"
          fill={_color}
        />
      </g>
      <g filter={`url(#${filterId6})`}>
        <path
          d="M43.0256 34.0077C43.0702 33.8403 43.3077 33.8403 43.3522 34.0077L43.9347 36.1961C43.9502 36.2544 43.9957 36.3 44.0539 36.3158L46.2308 36.9037C46.3974 36.9487 46.3974 37.185 46.2308 37.23L44.0539 37.8179C43.9957 37.8337 43.9502 37.8793 43.9347 37.9376L43.3522 40.126C43.3077 40.2934 43.0702 40.2934 43.0256 40.126L42.4432 37.9376C42.4276 37.8793 42.3822 37.8337 42.3239 37.8179L40.1471 37.23C39.9805 37.185 39.9805 36.9487 40.1471 36.9037L42.3239 36.3158C42.3822 36.3 42.4276 36.2544 42.4432 36.1961L43.0256 34.0077Z"
          fill={_color}
        />
      </g>
      <g filter={`url(#${filterId7})`}>
        <path
          d="M191.617 49.5466C191.637 49.4709 191.745 49.4709 191.765 49.5466L192.24 51.352C192.247 51.3783 192.268 51.3989 192.294 51.4061L194.073 51.8914C194.148 51.9118 194.148 52.0181 194.073 52.0385L192.294 52.5238C192.268 52.531 192.247 52.5516 192.24 52.5779L191.765 54.3833C191.745 54.459 191.637 54.459 191.617 54.3833L191.141 52.5779C191.134 52.5516 191.114 52.531 191.088 52.5238L189.309 52.0385C189.234 52.0181 189.234 51.9118 189.309 51.8914L191.088 51.4061C191.114 51.3989 191.134 51.3783 191.141 51.352L191.617 49.5466Z"
          fill={_color}
        />
      </g>
      <g opacity="0.1" filter={`url(#${filterId8})`}>
        <path
          d="M7.42743 45.4337C7.47198 45.2663 7.70952 45.2663 7.75407 45.4337L8.85041 49.5529C8.86593 49.6113 8.91139 49.6569 8.96966 49.6726L13.0632 50.7782C13.2298 50.8232 13.2298 51.0596 13.0632 51.1046L8.96966 52.2102C8.91139 52.2259 8.86593 52.2715 8.85041 52.3299L7.75407 56.4491C7.70952 56.6165 7.47198 56.6165 7.42743 56.4491L6.33109 52.3299C6.31557 52.2715 6.27011 52.2259 6.21184 52.2102L2.11826 51.1046C1.95168 51.0596 1.95168 50.8232 2.11826 50.7782L6.21184 49.6726C6.27011 49.6569 6.31557 49.6113 6.33109 49.5529L7.42743 45.4337Z"
          fill={_color}
        />
      </g>
      <defs>
        <filter
          id={filterId1}
          x="176.606"
          y="0.801992"
          width="13.6279"
          height="13.6997"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.608281" result="effect1_foregroundBlur_710_4554" />
        </filter>
        <filter
          id={filterId2}
          x="65.1035"
          y="4.28807"
          width="8.12112"
          height="8.19461"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.811042" result="effect1_foregroundBlur_710_4554" />
        </filter>
        <filter
          id={filterId3}
          x="6.85326"
          y="0.0119528"
          width="20.1099"
          height="20.229"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.608281" result="effect1_foregroundBlur_710_4554" />
        </filter>
        <filter
          id={filterId4}
          x="196.938"
          y="22.8716"
          width="13.2442"
          height="13.4072"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.608281" result="effect1_foregroundBlur_710_4554" />
        </filter>
        <filter
          id={filterId5}
          x="230.502"
          y="37.5344"
          width="16.8692"
          height="16.9644"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.608281" result="effect1_foregroundBlur_710_4554" />
        </filter>
        <filter
          id={filterId6}
          x="38.3999"
          y="32.26"
          width="9.57815"
          height="9.61355"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.811042" result="effect1_foregroundBlur_710_4554" />
        </filter>
        <filter
          id={filterId7}
          x="187.63"
          y="47.8677"
          width="8.12112"
          height="8.19461"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.811042" result="effect1_foregroundBlur_710_4554" />
        </filter>
        <filter
          id={filterId8}
          x="0.776601"
          y="44.0915"
          width="13.6279"
          height="13.6997"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.608281" result="effect1_foregroundBlur_710_4554" />
        </filter>
      </defs>
    </svg>
  );
};

export default CustomizableStars;
