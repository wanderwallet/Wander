import * as React from "react";
import type { SVGProps } from "react";
const SvgConnectWander = ({
  width = 56,
  height = 56,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    color="currentColor"
  >
    <rect x="0.5" y="0.5" width="55" height="55" rx="27.5" fill="#F9F9F9" />
    <rect x="0.5" y="0.5" width="55" height="55" rx="27.5" stroke="#D6D6DD" />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M35.5267 28.5091L28.6659 19.8095C28.3769 19.4345 28.0934 19.3732 27.783 19.7761L20.9116 28.4949L27.5623 34.506L28.2081 20.7342L28.854 34.506L35.5267 28.5091Z"
      fill="#248DEF"
    />
    <path
      d="M16.0078 37.5001L9.03501 22.6203C8.88543 22.2943 9.24263 21.9687 9.55342 22.1476L19.9797 28.1403L26.7567 35.7748L16.0078 37.5001Z"
      fill="#1259E8"
    />
    <path
      d="M40.4221 37.5001L47.3949 22.6203C47.5445 22.2943 47.1873 21.9687 46.8765 22.1476L36.4503 28.1403L29.6732 35.7748L40.4221 37.5001Z"
      fill="#1259E8"
    />
  </svg>
);

export default SvgConnectWander;
