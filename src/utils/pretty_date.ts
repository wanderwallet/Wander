import browser from "webextension-polyfill";

export function prettyDate(timestamp: number) {
  // TODO: This can be improved to include specific messages for "1" values.
  // TODO: In order to use this for past request, we should also include X days ago, X weeks ago, X months ago, X years ago and display the actual full date on hover.

  const elapsedSeconds = Math.round((Date.now() - timestamp) / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedSeconds < 60) {
    return browser.i18n.getMessage("formattedElapsedSeconds", [elapsedSeconds.toString()]);
  }

  if (elapsedMinutes < 60) {
    return browser.i18n.getMessage("formattedElapsedMinutes", [elapsedMinutes.toString()]);
  }

  return browser.i18n.getMessage("formattedElapsedHours", [elapsedHours.toString()]);
}
