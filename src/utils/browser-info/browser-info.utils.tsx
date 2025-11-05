function getBrowserInfo() {
  // Check if we're in a browser context where window.navigator is available
  if (typeof window === "undefined" || !window.navigator) {
    // Return default values for non-browser contexts (like background scripts)
    return {
      isBrave: false,
      isChromium: false,
      isChrome: false,
      isChromeAndroid: false,
      isChromeIOS: false,
      isEdge: false,
      isFirefox: false,
      isOpera: false,
      isSafari: false,
      isInAppAndroidBrowser: false,
      isAppleDevice: false,
    };
  }

  const { userAgent, userAgentData, vendor } = window.navigator;

  const isBrave = !!(window.navigator as any).brave;
  const isChromium = !!(window as any).chrome;
  const isChromeIOS = userAgent.match("CriOS");
  const isEdge = userAgent.includes("Edg");
  const isFirefox = userAgent.includes("Firefox");
  const isOpera = typeof (window as any).opr !== "undefined";
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const isChrome =
    isChromium &&
    vendor === "Google Inc." &&
    !isOpera &&
    !isEdge &&
    (typeof userAgentData === "undefined" || userAgentData.brands.some((x) => x.brand === "Google Chrome"));

  const isChromeAndroid = isChrome && userAgent.includes("Android");

  const isInAppAndroidBrowser =
    userAgent.includes("Android") && (userAgent.includes("wv") || userAgent.includes("WebView"));

  // Detect Apple devices (iOS, iPadOS, macOS)
  const isAppleDevice = /iPad|iPhone|iPod|Macintosh|Mac OS X|MacIntel/.test(userAgent) || isSafari || isChromeIOS;

  return {
    isBrave,
    isChromium,
    isChrome,
    isChromeAndroid,
    isChromeIOS,
    isEdge,
    isFirefox,
    isOpera,
    isSafari,
    isInAppAndroidBrowser,
    isAppleDevice,
  };
}

export const browserInfo = getBrowserInfo();
