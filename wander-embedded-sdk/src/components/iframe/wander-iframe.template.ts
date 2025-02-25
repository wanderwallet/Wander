import { MobileLayoutConfig } from "../../wander-embedded.types";

export interface WanderIframeTemplateContentOptions {
  mobileConfig?: MobileLayoutConfig;
}

export const getWanderIframeTemplateContent = ({
  mobileConfig = {}
}: WanderIframeTemplateContentOptions) => {
  const isFullscreen = mobileConfig.fullscreen;
  const padding = mobileConfig.padding ?? 0;

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
        padding: ${padding}px;
      }

      .iframe {
        inset: ${padding}px;
        width: ${isFullscreen ? "100dvw" : `calc(100dvw - ${padding * 2}px)`};
        height: ${
          isFullscreen
            ? "100dvh"
            : mobileConfig.height ?? `calc(100dvh - ${padding * 2}px)`
        };
        min-width: ${
          isFullscreen ? "100dvw" : `calc(100dvw - ${padding * 2}px)`
        };
        min-height: ${
          isFullscreen
            ? "100dvh"
            : mobileConfig.height ?? `calc(100dvh - ${padding * 2}px)`
        };
        max-width: ${
          isFullscreen ? "100dvw" : `calc(100dvw - ${padding * 2}px)`
        };
        max-height: ${
          isFullscreen
            ? "100dvh"
            : mobileConfig.height ?? `calc(100dvh - ${padding * 2}px)`
        };
        border: ${
          isFullscreen
            ? "none"
            : mobileConfig.border !== undefined
            ? mobileConfig.border
              ? "var(--borderWidth, 2px) solid var(--borderColor, rgba(0, 0, 0, .125))"
              : "none"
            : "none"
        };
        border-radius: ${isFullscreen ? 0 : mobileConfig.borderRadius ?? 0}px;
        box-shadow: ${
          isFullscreen
            ? "none"
            : "var(--boxShadow, 0 0 16px 0 rgba(0, 0, 0, 0.125))"
        };
        transform: none;
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
    
    /* Sidebar and Half specific styles */
    .iframe[data-layout="sidebar"],
    .iframe[data-layout="half"] {
      transition: opacity linear 150ms, transform linear 150ms;
    }
    
    /* Right position */
    .iframe[data-layout="sidebar"][data-position="right"],
    .iframe[data-layout="half"][data-position="right"] {
      top: var(--backdropPadding, 0);
      right: var(--backdropPadding, 0);
      border-width: 0 0 0 var(--borderWidth, 2px);
    }
    
    /* Left position */
    .iframe[data-layout="sidebar"][data-position="left"],
    .iframe[data-layout="half"][data-position="left"] {
      top: var(--backdropPadding, 0);
      left: var(--backdropPadding, 0);
      border-width: 0 var(--borderWidth, 2px) 0 0;
    }
    
    /* Hide transform states */
    .iframe[data-layout="sidebar"][data-position="right"]:not(.show),
    .iframe[data-layout="half"][data-position="right"]:not(.show) {
      transform: translate(calc(100% + var(--backdropPadding, 32px)), 0);
    }
    
    .iframe[data-layout="sidebar"][data-position="left"]:not(.show),
    .iframe[data-layout="half"][data-position="left"]:not(.show) {
      transform: translate(calc(-100% - var(--backdropPadding, 32px)), 0);
    }
    
    /* Show transform state */
    .iframe[data-layout="sidebar"].show,
    .iframe[data-layout="half"].show {
      transform: translate(0, 0);
    }
    
    /* Expanded styles */
    .iframe[data-layout="sidebar"][data-expanded="true"],
    .iframe[data-layout="half"][data-expanded="true"] {
      top: 0;
      height: var(--preferredHeight, 100dvh);
      max-height: var(--preferredHeight, 100dvh);
      border-radius: 0;
    }
    
    .iframe[data-layout="sidebar"][data-expanded="true"][data-position="right"],
    .iframe[data-layout="half"][data-expanded="true"][data-position="right"] {
      right: 0;
    }
    
    .iframe[data-layout="sidebar"][data-expanded="true"][data-position="left"],
    .iframe[data-layout="half"][data-expanded="true"][data-position="left"] {
      left: 0;
    }
  </style>
`;
};
