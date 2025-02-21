import * as React from "react";
import type { SVGProps } from "react";

const SvgCollapseIt = ({
  width = 24,
  height = 24,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M16.4142 9L21.7071 3.70711C22.0976 3.31658 22.0976 2.68342 21.7071 2.29289C21.3166 1.90237 20.6834 1.90237 20.2929 2.29289L15 7.58579V4C15 3.44772 14.5523 3 14 3C13.4477 3 13 3.44772 13 4V10C13 10.5523 13.4477 11 14 11H20C20.5523 11 21 10.5523 21 10C21 9.44772 20.5523 9 20 9H16.4142Z"
      fill="#666666"
    />
    <path
      d="M9 20V16.4142L3.70711 21.7071C3.31658 22.0976 2.68342 22.0976 2.29289 21.7071C1.90237 21.3166 1.90237 20.6834 2.29289 20.2929L7.58579 15H4C3.44772 15 3 14.5523 3 14C3 13.4477 3.44772 13 4 13H10C10.5523 13 11 13.4477 11 14V20C11 20.5523 10.5523 21 10 21C9.44772 21 9 20.5523 9 20Z"
      fill="#666666"
    />
  </svg>
);

export default SvgCollapseIt;
