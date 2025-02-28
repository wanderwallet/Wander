import * as React from "react";
import type { SVGProps } from "react";

const SvgExpandIt = ({
  width = 20,
  height = 21,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    color="currentColor"
  >
    <path
      d="M11.6667 8.83333L17.5 3M17.5 3H12.5M17.5 3V8M8.33333 12.1667L2.5 18M2.5 18H7.5M2.5 18L2.5 13"
      stroke="currentColor"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export default SvgExpandIt;
