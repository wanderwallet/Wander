// Production:

import offline64 from "url:/assets/icons/offline/logo64.png";
import offline128 from "url:/assets/icons/offline/logo128.png";
import offline256 from "url:/assets/icons/offline/logo256.png";

import online64 from "url:/assets/icons/online/logo64.png";
import online128 from "url:/assets/icons/online/logo128.png";
import online256 from "url:/assets/icons/online/logo256.png";

import locked64 from "url:/assets/icons/locked/logo64.png";
import locked128 from "url:/assets/icons/locked/logo128.png";
import locked256 from "url:/assets/icons/locked/logo256.png";

// Development:

// Same as production ones, then:
//
// 1. Open with GIMP.
// 2. Colors > Hua-Saturation:
// - Hue = -130
// - Lightness = -75.5
// - Saturation = 100

import devOffline64 from "url:/assets/icons/offline/logo64.development.png";
import devOffline128 from "url:/assets/icons/offline/logo128.development.png";
import devOffline256 from "url:/assets/icons/offline/logo256.development.png";

import devOnline64 from "url:/assets/icons/online/logo64.development.png";
import devOnline128 from "url:/assets/icons/online/logo128.development.png";
import devOnline256 from "url:/assets/icons/online/logo256.development.png";

import devLocked64 from "url:/assets/icons/locked/logo64.development.png";
import devLocked128 from "url:/assets/icons/locked/logo128.development.png";
import devLocked256 from "url:/assets/icons/locked/logo256.development.png";

import browser from "webextension-polyfill";
import { ExtensionStorage } from "./storage";

interface LogosBySize {
  64: string;
  128: string;
  256: string;
}

interface LogosByEnvironment {
  default: LogosBySize;
  development: LogosBySize;
}

const offlineLogos: LogosByEnvironment = {
  default: {
    64: offline64,
    128: offline128,
    256: offline256
  },
  development: {
    64: devOffline64,
    128: devOffline128,
    256: devOffline256
  }
};

const onlineLogos: LogosByEnvironment = {
  default: {
    64: online64,
    128: online128,
    256: online256
  },
  development: {
    64: devOnline64,
    128: devOnline128,
    256: devOnline256
  }
};

const lockedLogos: LogosByEnvironment = {
  default: {
    64: locked64,
    128: locked128,
    256: locked256
  },
  development: {
    64: devLocked64,
    128: devLocked128,
    256: devLocked256
  }
};

/**
 * Update the popup icon
 *
 * @param hasPerms Does the site have any permissions?
 */
export async function updateIcon(hasPerms: boolean) {
  const val = await ExtensionStorage.get("decryption_key");

  // Set logos if connected / if not connected:
  const logosByEnvironment = val
    ? hasPerms
      ? onlineLogos
      : offlineLogos
    : lockedLogos;

  // Use the "gold" version for development:
  const logosBySize =
    logosByEnvironment[process.env.NODE_ENV] || logosByEnvironment.default;

  if (browser.runtime.getManifest().manifest_version === 3) {
    await browser.action.setIcon({
      path: logosBySize
    });
  } else {
    await browser.browserAction.setIcon({
      path: logosBySize
    });
  }
}
