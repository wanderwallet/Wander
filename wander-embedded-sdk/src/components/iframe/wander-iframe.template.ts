import { MobileLayoutConfig } from "../../wander-embedded.types";

export interface WanderIframeTemplateContentOptions {
  mobileConfig?: MobileLayoutConfig;
}

const getMobileStyles = (mobileConfig: MobileLayoutConfig = {}) => {
  const padding = mobileConfig.padding ?? 0;
  const isFullscreen = mobileConfig.fullscreen;

  return {
    width: isFullscreen ? "100dvw" : `calc(100dvw - ${padding * 2}px)`,
    height: isFullscreen
      ? "100dvh"
      : mobileConfig.height ?? `calc(100dvh - ${padding * 2}px)`,
    border: isFullscreen
      ? "none"
      : mobileConfig.border !== undefined
      ? mobileConfig.border
        ? "var(--borderWidth, 2px) solid var(--borderColor, rgba(0, 0, 0, .125))"
        : "none"
      : "none",
    borderRadius: `${isFullscreen ? 0 : mobileConfig.borderRadius ?? 0}px`,
    boxShadow: isFullscreen
      ? "none"
      : "var(--boxShadow, 0 0 16px 0 rgba(0, 0, 0, 0.125))",
    padding: `${isFullscreen ? 0 : padding}px`
  };
};

export const getWanderIframeTemplateContent = ({
  mobileConfig = {}
}: WanderIframeTemplateContentOptions) => {
  const mobileStyles = getMobileStyles(mobileConfig);

  return `
  <style>
    /* Base backdrop styles */
    .backdrop {
      position: fixed;
      z-index: var(--zIndex, 9999);
      inset: 0;
      background: var(--backdropBackground, rgba(255, 255, 255, .0625));
      backdropFilter: var(--backdropBackdropFilter, blur(12px));
      padding: var(--backdropPadding, 32px);
      transition: opacity linear 150ms;
      pointer-events: none;
      opacity: 0;
    }

    .backdrop.show {
      pointer-events: auto;
      opacity: 1;
    }

    /* Base iframe styles */
    .iframe {
      position: fixed;
      z-index: calc(var(--zIndex, 9999) + 1);
      background: var(--background, white);
      border: var(--borderWidth, 2px) solid var(--borderColor, rgba(0, 0, 0, .125));
      border-radius: var(--borderRadius, 10px);
      box-shadow: var(--boxShadow, 0 0 16px 0 rgba(0, 0, 0, 0.125));
      width: calc(var(--preferredWidth, 400px) - 2 * var(--borderWidth, 2px));
      height: calc(var(--preferredHeight, 600px) - 2 * var(--borderWidth, 2px));
      min-width: 400px;
      min-height: 400px;
      max-width: calc(100dvw - 2 * var(--backdropPadding, 32px) - 2 * var(--borderWidth, 2px));
      max-height: calc(100dvh - 2 * var(--backdropPadding, 32px) - 2 * var(--borderWidth, 2px));
      box-sizing: content-box;
      transition: transform linear 150ms, opacity linear 150ms;
      pointer-events: none;
      opacity: 0;
    }

    .iframe.show {
      pointer-events: auto;
      opacity: 1;
    }

    /* Mobile styles */
    @media (max-width: 540px) {
      .backdrop {
        padding: ${mobileStyles.padding} !important;
      }

      .iframe {
        inset: ${mobileStyles.padding} !important;
        width: ${mobileStyles.width} !important;
        height: ${mobileStyles.height} !important;
        min-width: ${mobileStyles.width} !important;
        min-height: ${mobileStyles.height} !important;
        max-width: ${mobileStyles.width} !important;
        max-height: ${mobileStyles.height} !important;
        border: ${mobileStyles.border} !important;
        border-radius: ${mobileStyles.borderRadius} !important;
        box-shadow: ${mobileStyles.boxShadow} !important;
        transform: none !important;
      }
    }

    /* Popup specific styles */
    .iframe[data-layout="popup"] {
      transition: opacity linear 150ms;
    }

    .iframe[data-layout="popup"][data-position="top-left"] {
      top: var(--backdropPadding, 32px);
      left: var(--backdropPadding, 32px);
    }

    .iframe[data-layout="popup"][data-position="top-right"] {
      top: var(--backdropPadding, 32px);
      right: var(--backdropPadding, 32px);
    }

    .iframe[data-layout="popup"][data-position="bottom-left"] {
      bottom: var(--backdropPadding, 32px);
      left: var(--backdropPadding, 32px);
    }

    .iframe[data-layout="popup"][data-position="bottom-right"] {
      bottom: var(--backdropPadding, 32px);
      right: var(--backdropPadding, 32px);
    }


    /* Modal specific styles */
    .iframe[data-layout="modal"] {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: opacity linear 150ms;
    }
  </style>
`;
};
