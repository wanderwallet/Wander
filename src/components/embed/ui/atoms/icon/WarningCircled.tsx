import * as React from "react";
import type { SVGProps } from "react";
const SvgWarningCircled = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <circle cx="24" cy="24" r="24" fill="#FFEEED" />
    <path
      d="M23.8926 28.9839C22.5752 28.9839 21.8921 28.3252 21.8433 27.0078L21.4042 12.9555C21.3554 11.5893 22.0141 10.9062 23.3803 10.9062H25.8687C27.2349 10.9062 27.8936 11.5893 27.8448 12.9555L27.4057 27.0078C27.3569 28.3252 26.6738 28.9839 25.3564 28.9839H23.8926ZM21.7336 33.5948C21.7336 32.253 22.4045 31.5821 23.7463 31.5821H25.5028C26.8446 31.5821 27.5155 32.253 27.5155 33.5948V35.0586C27.5155 36.4004 26.8446 37.0713 25.5028 37.0713H23.7463C22.4045 37.0713 21.7336 36.4004 21.7336 35.0586V33.5948Z"
      fill="#EE5A4F"
    />
  </svg>
);
export default SvgWarningCircled;
