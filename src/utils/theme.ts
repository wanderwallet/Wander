import { css } from "styled-components";

/**
 * Hover effect css
 * Applies a slight hue to the background of
 * the element without using background-color
 */
export const hoverEffect = css`
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    overflow: hidden;
    z-index: -1;
    transform: translate(-50%, -50%);
    transition: background-color 0.35s ease;
  }

  &:hover::after {
    background-color: rgba(${(props) => props.theme.theme}, 0.1);
  }

  &:active::after {
    background-color: rgba(${(props) => props.theme.theme}, 0.15);
  }
`;

export function getFormattedColor(color: string) {
  let formattedColor = "";
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    formattedColor = color;
  } else if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    formattedColor = `#${color}`;
  } else if (/^\d{1,3}, ?\d{1,3}, ?\d{1,3}$/.test(color)) {
    formattedColor = `rgb(${color})`;
  } else if (/^\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?.+$/.test(color)) {
    formattedColor = `rgba(${color})`;
  }
  return formattedColor;
}
