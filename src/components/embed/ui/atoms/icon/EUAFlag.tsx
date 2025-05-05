import React from "react";

const SvgEUAFlag = ({ color = "currentColor", width = 20, height = 20, ...props }) => {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M24.25 12.5C24.25 18.9893 18.9893 24.25 12.5 24.25C6.01065 24.25 0.75 18.9893 0.75 12.5C0.75 6.01065 6.01065 0.75 12.5 0.75C18.9893 0.75 24.25 6.01065 24.25 12.5Z"
        fill="url(#pattern0_15_2291)"
        stroke="#D6D6DD"
        stroke-width="0.5"
      />
      <defs>
        <pattern id="pattern0_15_2291" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use transform="translate(-0.45) scale(0.00153846)" />
        </pattern>
        <image id="image0_15_2291" width="1235" height="650" preserveAspectRatio="none" />
      </defs>
    </svg>
  );
};

export default SvgEUAFlag;
