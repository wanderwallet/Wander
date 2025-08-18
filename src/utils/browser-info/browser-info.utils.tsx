const { userAgent, userAgentData, vendor } = window.navigator;

const isBrave = window.navigator.brave;
const isChromium = !!window.chrome;
const isChromeIOS = userAgent.match("CriOS");
const isEdge = userAgent.includes("Edg");
const isFirefox = userAgent.includes("Firefox");
const isOpera = typeof (window as any).opr !== "undefined";

const isChrome =
  isChromium &&
  vendor === "Google Inc." &&
  !isOpera &&
  !isEdge &&
  (typeof userAgentData === "undefined" || userAgentData.brands.some((x) => x.brand === "Google Chrome"));

const isChromeAndroid = isChrome && userAgent.includes("Android");

const isInAppAndroidBrowser =
  userAgent.includes("Android") && (userAgent.includes("wv") || userAgent.includes("WebView"));

export const browserInfo = {
  isBrave,
  isChromium,
  isChrome,
  isChromeAndroid,
  isChromeIOS,
  isEdge,
  isFirefox,
  isOpera,
  isInAppAndroidBrowser,
};
