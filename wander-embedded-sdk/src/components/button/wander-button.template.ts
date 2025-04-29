import { WanderEmbeddedLogoVariant } from "../../wander-embedded.types";

export interface WanderButtonTemplateContentOptions {
  wanderLogo: WanderEmbeddedLogoVariant;
  showLabel: boolean;
  showBalance: boolean;
  customStyles: string;
  cssVariableKeys: string[];
}

// TODO: Missing :hover, :active and :focus styles

export const getWanderButtonTemplateContent = ({
  wanderLogo,
  showLabel,
  showBalance,
  customStyles,
  cssVariableKeys = []
}: WanderButtonTemplateContentOptions) => `
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

  .button {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--gapInside);
    outline: none;
    user-select: none;
    cursor: pointer;
    min-width: var(--minWidth);
    min-height: var(--minHeight);
    z-index: 0;
    padding: var(--padding);
    font: var(--font);
    color: var(--color);
    background: transparent;
    border: none;
    border-radius: var(--borderRadius);
  }

  .button::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--background);
    border: var(--borderWidth) solid var(--borderColor);
    border-radius: var(--borderRadius);
    box-shadow: var(--boxShadow);
    z-index: -1;
    transition: transform linear 50ms;
  }

  .button::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--borderRadius);
    border-bottom-right-radius: 0;
    z-index: -1;
  }

  .button:hover .wanderLogo {
    animation: sail 3s infinite;
  }

  .button:active::before {
    transform: scale(0.95);
  }

  .wanderLogo {
    width: 32px;
    aspect-ratio: 1;
    transition: transform linear 50ms;
  }

  .label {
  }

  .label[hidden],
  .label:empty:not(.isLoading) {
    display: none;
  }

  .label.isLoading {
    background: currentColor;
    width: 64px;
    height: 12px;
    border-radius: 6px;
    animation: blink-opacity 3s infinite;
  }

  .balance {
    filter: blur(0px);
    transition: filter linear 300ms;
  }

  .balance[hidden],
  .balance:empty:not(.isLoading) {
    display: none;
  }

  .balance.isLoading {
    background: currentColor;
    width: 64px;
    height: 12px;
    border-radius: 6px;
    animation: blink-opacity 3s infinite;
  }

  .balance.isHidden {
    filter: blur(6px);
  }

  .indicator,
  .notifications {
    position: absolute;
    right: calc(4px + var(--borderWidth));
    bottom: calc(4px + var(--borderWidth));
    border-radius: 32px;
    border: var(--borderWidth) solid var(--borderColor);
    transition: transform linear 150ms, background linear 150ms;
    pointer-events: none;
  }

  .indicator {
    width: 8px;
    height: 8px;
    z-index: 8;
    background: #CCC;
    transform: translate(50%, 50%);
  }

  .indicator.isLoading {
    animation: blink-indicator 3s infinite;
  }

  .notifications {
    background: red;
    font-size: 12px;
    font-weight: bold;
    min-height: 22px;
    min-width: 22px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transform: translate(50%, 50%) scale(1);
  }

  .isConnected + .indicator {
    /* TODO: Add CSS var */
    background: #56C980;
  }

  .notifications:empty {
    transform: translate(50%, 50%) scale(0);
  }

  @keyframes sail {
    0% {
      transform: rotate(-10deg) translate(0, 1px);
    }
    50% {
      transform: rotate(10deg) translate(0, -1px);
    }
    100% {
      transform: rotate(-10deg) translate(0, 1px);
    }
  }

  @keyframes blink-opacity {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.25;
    }
  }

  @keyframes blink-indicator {
    0%, 100% {
      background: #CCC;
    }
    50% {
      background: #56C980;
    }
  }

  ${customStyles}
</style>

<button class="button">

  <svg
    class="wanderLogo"
    ${wanderLogo === "none" ? "hidden" : ""}
    viewBox="0 0 257 121"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">

    <path d="M177.235 60.5134L131.532 2.56198C129.607 0.0634354 127.719 -0.344614 125.651 2.33897L79.8771 60.4191L124.181 100.462L128.483 8.72145L132.785 100.462L177.235 60.5134Z"
      fill="${wanderLogo === "text-color" ? "currentColor" : "url(#gradient1)"}"
      fill-rule="evenodd"
      clip-rule="evenodd" />
    <path d="M209.689 120.406L256.138 21.2852C257.135 19.114 254.755 16.9443 252.685 18.1364L183.231 58.0562L138.086 108.914L209.689 120.406Z"
      fill="${
        wanderLogo === "text-color" ? "currentColor" : "url(#gradient2)"
      }" />
    <path d="M47.211 120.406L0.762138 21.2853C-0.234245 19.1141 2.14523 16.9445 4.21552 18.1365L73.6694 58.0564L118.814 108.914L47.211 120.406Z"
      fill="${
        wanderLogo === "text-color" ? "currentColor" : "url(#gradient3)"
      }" />

    <defs>
      <linearGradient
        id="gradient1"
        x1="128.213"
        y1="100.462"
        x2="128.213"
        y2="0.5"
        gradientUnits="userSpaceOnUse">
        <stop stop-color="#6B57F9"/>
        <stop offset="1" stop-color="#9787FF"/>
      </linearGradient>

      <linearGradient
        id="gradient2"
        x1="156.561"
        y1="80.0762"
        x2="218.926"
        y2="115.502"
        gradientUnits="userSpaceOnUse">
        <stop stop-color="#6B57F9"/>
        <stop offset="1" stop-color="#9787FF"/>
      </linearGradient>

      <linearGradient
        id="gradient3"
        x1="100.34"
        y1="80.0764"
        x2="37.9744"
        y2="115.502"
        gradientUnits="userSpaceOnUse">
        <stop stop-color="#6B57F9"/>
        <stop offset="1" stop-color="#9787FF"/>
      </linearGradient>
    </defs>
  </svg>

  <span class="label" ${showLabel ? "" : "hidden"}></span>
  <span class="balance" ${showBalance ? "" : "hidden"}></span>
</button>

<span class="indicator"></span>
<span class="notifications"></span>
`;
