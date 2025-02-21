import * as React from "react";
import type { SVGProps } from "react";
const SvgArrowDown = ({
  width = "16",
  height = "16",
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    color="currentColor"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M3.52876 5.52858C3.78911 5.26823 4.21122 5.26823 4.47157 5.52858L8.00016 9.05717L11.5288 5.52858C11.7891 5.26823 12.2112 5.26823 12.4716 5.52858C12.7319 5.78892 12.7319 6.21103 12.4716 6.47138L8.47157 10.4714C8.21122 10.7317 7.78911 10.7317 7.52876 10.4714L3.52876 6.47138C3.26841 6.21103 3.26841 5.78892 3.52876 5.52858Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgArrowDown;
