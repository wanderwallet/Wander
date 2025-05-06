export interface WanderIframeTemplateContentOptions {
  customStyles: string;
  cssVariableKeys: string[];
}

export const getWanderIframeTemplateContent = ({
  customStyles,
  cssVariableKeys = [],
}: WanderIframeTemplateContentOptions) => {
  return `
  <style>

    @media (prefers-color-scheme: light) {
      :host {
        ${cssVariableKeys
          .map((cssVariableKey) => {
            return `--${cssVariableKey}: var(--${cssVariableKey}Light);`;
          })
          .join("\n")}
      }
    }

    @media (prefers-color-scheme: dark) {
      :host {
        ${cssVariableKeys
          .map((cssVariableKey) => {
            return `--${cssVariableKey}: var(--${cssVariableKey}Dark);`;
          })
          .join("\n")}
      }
    }

    /* Base backdrop styles */

    .backdrop {
      position: fixed;
      z-index: calc(var(--zIndex) + 1);
      inset: 0;
      background: var(--backdropBackground);
      backdrop-filter: var(--backdropBackdropFilter);
      padding: var(--backdropPadding);
      transition: opacity linear 150ms;
      pointer-events: none;
      opacity: 0;
    }

    .backdrop.show {
      pointer-events: auto;
      opacity: 1;
    }

    /* Iframe wrapper styles */

    .iframe-wrapper {
      position: fixed;
      z-index: calc(var(--zIndex, 9999) + 3);
      background: var(--background);
      border: var(--borderWidth) solid var(--borderColor);
      border-radius: var(--borderRadius);
      box-shadow: var(--boxShadow);
      width: calc(var(--preferredWidth) + 2 * var(--borderWidth));
      height: calc(var(--preferredHeight) + 2 * var(--borderWidth));
      min-width: 400px;
      min-height: 400px;
      max-width: calc(100dvw - 2 * var(--backdropPadding));
      max-height: calc(100dvh - 2 * var(--backdropPadding));
      box-sizing: border-box;
      pointer-events: none;
      opacity: 0;
      overflow: hidden;
    }

    .iframe-wrapper.show {
      pointer-events: auto;
      opacity: 1;
    }

    /* Base iframe styles */
    .iframe {
      border: none;
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Half layout image styles */

    .half-image {
      position: fixed;
      width: calc(50vw - 2 * var(--backdropPadding, 0px));
      z-index: calc(var(--zIndex) + 2);
      opacity: 0;
      transition: opacity 300ms ease-in-out;
      pointer-events: none;
      top: 50%;
      transform: translateY(-50%);
      display: none;

    }

    .half-image.show {
      opacity: 1;
    }

    /* Position-specific styles for half-image */

    .half-image[data-position="left"] {
      left: 0;
    }

    .half-image[data-position="right"] {
      right: 0;
    }

    /* Mobile styles */

    @media (max-width: 540px) {
      .backdrop {
        padding: var(--mobilePadding, 0);
      }

      .iframe-wrapper {
        inset: var(--mobilePadding, 0);
        width: calc(100dvw - 2 * var(--mobilePadding, 0));
        height: var(--mobileHeight, 100dvh);
        min-width: calc(100dvw - 2 * var(--mobilePadding, 0));
        min-height: var(--mobileHeight, 100dvh);
        max-width: calc(100dvw - 2 * var(--mobilePadding, 0));
        max-height: var(--mobileHeight, 100dvh);
        border-width: var(--mobileBorderWidth, 0);
        border-color: var(--mobileBorderColor, rgba(0, 0, 0, .125));
        border-radius: var(--mobileBorderRadius, 0);
        box-shadow: var(--mobileBoxShadow, none);
        transform: none;
      }

      .half-image {
        display: none;
      }

      .iframe-wrapper[data-expand-on-mobile="true"] {
        inset: 0;
        width: 100dvw;
        height: 100dvh;
        min-width: 100dvw;
        min-height: 100dvh;
        max-width: 100dvw;
        max-height: 100dvh;
        border: none;
        border-radius: 0;
        box-shadow: none;
      }
    }

    /* Popup specific styles */

    .iframe-wrapper[data-layout="popup"] {
      transition: opacity linear 150ms, height ease-in-out 150ms;
    }

    .iframe-wrapper[data-layout="popup"][data-position="top-left"] {
      top: var(--backdropPadding);
      left: var(--backdropPadding);
    }

    .iframe-wrapper[data-layout="popup"][data-position="top-right"] {
      top: var(--backdropPadding);
      right: var(--backdropPadding);
    }

    .iframe-wrapper[data-layout="popup"][data-position="bottom-left"] {
      bottom: var(--backdropPadding);
      left: var(--backdropPadding);
    }

    .iframe-wrapper[data-layout="popup"][data-position="bottom-right"] {
      bottom: var(--backdropPadding);
      right: var(--backdropPadding);
    }

    /* Modal specific styles */

    .iframe-wrapper[data-layout="modal"] {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: opacity linear 150ms, height ease-in-out 150ms;
    }

    /* Sidebar specific styles */

    .iframe-wrapper[data-layout="sidebar"] {
      opacity: 1;
      transition: transform ease-in-out 150ms;
    }

    /* Half specific styles */

    .iframe-wrapper[data-layout="half"] {
      transition: opacity linear 150ms;
    }

    /* Right position - Sidebar & Half */

    .iframe-wrapper[data-layout="sidebar"][data-position="right"],
    .iframe-wrapper[data-layout="half"][data-position="right"] {
      top: var(--backdropPadding, 0);
      right: var(--backdropPadding, 0);
      border-width: 0;
    }

    /* Left position - Sidebar & Half */

    .iframe-wrapper[data-layout="sidebar"][data-position="left"],
    .iframe-wrapper[data-layout="half"][data-position="left"] {
      top: var(--backdropPadding, 0);
      left: var(--backdropPadding, 0);
      border-width: 0;
    }

    /* Hide transform states - Sidebar */

    .iframe-wrapper[data-layout="sidebar"][data-position="right"]:not(.show) {
      transform: translate(calc(100% + var(--backdropPadding) + 32px), 0);
    }

    .iframe-wrapper[data-layout="sidebar"][data-position="left"]:not(.show) {
      transform: translate(calc(-100% - var(--backdropPadding) - 32px), 0);
    }

    /* Show transform state - Sidebar */

    .iframe-wrapper[data-layout="sidebar"].show {
      transform: translate(0, 0);
    }

    /* Expanded styles */

    .iframe-wrapper[data-layout="sidebar"][data-expanded="true"],
    .iframe-wrapper[data-layout="half"][data-expanded="true"] {
      top: 0;
      height: var(--preferredHeight);
      max-height: var(--preferredHeight);
      border-radius: 0;
    }

    .iframe-wrapper[data-layout="sidebar"][data-expanded="true"][data-position="right"],
    .iframe-wrapper[data-layout="half"][data-expanded="true"][data-position="right"] {
      right: 0;
      border-width: 0 0 0 var(--borderWidth);
    }

    .iframe-wrapper[data-layout="sidebar"][data-expanded="true"][data-position="left"],
    .iframe-wrapper[data-layout="half"][data-expanded="true"][data-position="left"] {
      left: 0;
      border-width: 0 var(--borderWidth) 0 0;
    }

    ${customStyles}
  </style>
`;
};
