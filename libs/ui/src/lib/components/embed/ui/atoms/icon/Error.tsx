import * as React from "react";
import type { SVGProps } from "react";
import { withThemeAwareColor } from "./IconBase";

const SvgError = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    color="red">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 14C11.448 14 11 13.552 11 13V8C11 7.448 11.448 7 12 7C12.552 7 13 7.448 13 8V13C13 13.552 12.552 14 12 14Z"
      fill="currentColor"
    />
    <circle cx="12" cy="16" r="1.25" fill="currentColor" />
  </svg>
);

export default withThemeAwareColor(SvgError);
