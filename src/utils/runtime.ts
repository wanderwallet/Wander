import browser, { type Storage } from "webextension-polyfill";

// Types:

export interface StorageChange<T = unknown> extends Storage.StorageChange {
  newValue?: T;
  oldValue?: T;
}

// Utils:

export function isManifestv3() {
  return browser.runtime.getManifest().manifest_version === 3;
}

export function getVersion() {
  return browser.runtime.getManifest().version;
}

export function getVersionLabel() {
  return `v${getVersion()}`;
}

export function getPreReleaseVersionLabel() {
  let preReleaseVersionLabel = "";

  if (process.env.BETA_VERSION) {
    preReleaseVersionLabel = process.env.BETA_VERSION.toLowerCase();
  } else if (process.env.NODE_ENV === "development") {
    preReleaseVersionLabel = browser.i18n.getMessage("development_version").toLowerCase();
  }

  return preReleaseVersionLabel;
}

export function getFullVersionLabel() {
  const preReleaseVersionLabel = getPreReleaseVersionLabel();

  return `${getVersionLabel()}${preReleaseVersionLabel ? `${preReleaseVersionLabel}` : ""}`;
}
