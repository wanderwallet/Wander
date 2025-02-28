import * as React from "react";
import type { SVGProps } from "react";
const SvgXClose = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    viewBox="0 0 25 25"
    color="currentColor"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m18.5 6.5-12 12m0-12 12 12"
    />
  </svg>
);
export default SvgXClose;
