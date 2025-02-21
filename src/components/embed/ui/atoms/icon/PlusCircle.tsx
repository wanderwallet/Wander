import * as React from "react";
import type { SVGProps } from "react";

const SvgPlusCircle = ({
  width = 20,
  height = 20,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <g clip-path="url(#clip0_19_1270)">
      <path
        d="M9.99984 6.66669V13.3334M6.6665 10H13.3332M18.3332 10C18.3332 14.6024 14.6022 18.3334 9.99984 18.3334C5.39746 18.3334 1.6665 14.6024 1.6665 10C1.6665 5.39765 5.39746 1.66669 9.99984 1.66669C14.6022 1.66669 18.3332 5.39765 18.3332 10Z"
        stroke="currentColor"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_19_1270">
        <rect width={width} height={height} fill="white" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgPlusCircle;
