import * as React from "react";
import type { SVGProps } from "react";

const SvgCompassIcon = ({ width = 24, height = 24, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...(props as any)}>
    <path
      d="M11.75 19.5C16.0302 19.5 19.5 16.0302 19.5 11.75C19.5 7.46979 16.0302 4 11.75 4C7.46979 4 4 7.46979 4 11.75C4 16.0302 7.46979 19.5 11.75 19.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.8596 8.85612C14.2383 8.72991 14.4276 8.66681 14.5535 8.7117C14.663 8.75077 14.7492 8.83698 14.7883 8.94654C14.8332 9.07243 14.7701 9.26174 14.6439 9.64037L13.491 13.0989C13.4551 13.2067 13.4371 13.2607 13.4065 13.3054C13.3794 13.3451 13.3451 13.3794 13.3054 13.4065C13.2607 13.4371 13.2067 13.4551 13.0989 13.491L9.64037 14.6439C9.26174 14.7701 9.07243 14.8332 8.94654 14.7883C8.83698 14.7492 8.75077 14.663 8.7117 14.5535C8.66681 14.4276 8.72991 14.2383 8.85612 13.8596L10.009 10.4011C10.0449 10.2933 10.0629 10.2393 10.0935 10.1946C10.1206 10.1549 10.1549 10.1206 10.1946 10.0935C10.2393 10.0629 10.2933 10.0449 10.4011 10.009L13.8596 8.85612Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SvgCompassIcon;
