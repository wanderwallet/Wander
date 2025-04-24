// Cache for app logo results
let cachedAppLogo: string | undefined = undefined;

// Constants for logo fetching
const ICON_SIZE_REGEX = /(\d+)x\d+/;
const FETCH_TIMEOUT_MS = 2000;
const FAVICON_TIMEOUT_MS = 1000;

// Types for manifest parsing
interface ManifestIcon {
  src: string;
  sizes?: string;
  type?: string;
}

interface WebAppManifest {
  icons?: ManifestIcon[];
  [key: string]: any;
}

/**
 * Converts a relative URL to an absolute URL
 */
const getAbsoluteUrl = (
  url: string,
  origin = window.location.origin
): string | undefined => {
  if (!url) return;

  try {
    return new URL(url, origin).href;
  } catch {}
};

/**
 * Fetches with a timeout to prevent hanging requests
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Gets the size value from a link element
 */
const getLinkSize = (el: HTMLLinkElement): number => {
  if (!el.sizes?.value) return 0;
  const match = el.sizes.value.match(ICON_SIZE_REGEX);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Attempts to find an app logo from the web app manifest
 */
const getLogoFromManifest = async (): Promise<string | undefined> => {
  const manifestLink = document.querySelector("link[rel='manifest']");
  if (!(manifestLink instanceof HTMLLinkElement)) return;

  const manifestUrl = getAbsoluteUrl(manifestLink.href);
  if (!manifestUrl) return;

  try {
    const response = await fetchWithTimeout(manifestUrl, {
      method: "GET",
      cache: "force-cache",
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status}`);
    }

    const manifest: WebAppManifest = await response.json();

    if (!manifest.icons?.length) return;

    // Filter out icons without src
    const validIcons = manifest.icons.filter((icon) => icon?.src);
    if (!validIcons.length) return;

    // Sort icons by format and size
    const sortedIcons = validIcons.sort((a, b) => {
      // Prefer SVG (vector) over other formats
      const aIsSvg = a.type === "image/svg+xml" || a.src?.endsWith(".svg");
      const bIsSvg = b.type === "image/svg+xml" || b.src?.endsWith(".svg");

      if (aIsSvg && !bIsSvg) return -1;
      if (!aIsSvg && bIsSvg) return 1;

      // Then sort by size
      const sizeA = parseInt(a.sizes?.split("x")[0] || "0", 10);
      const sizeB = parseInt(b.sizes?.split("x")[0] || "0", 10);
      return sizeB - sizeA;
    });

    return getAbsoluteUrl(sortedIcons[0].src, manifestUrl);
  } catch (err) {
    console.error("Error fetching web app manifest:", err);
  }
};

/**
 * Attempts to find an app logo from DOM selectors
 */
const getLogoFromDOM = (): string | undefined => {
  const faviconSelectors = [
    "link[rel='icon'][type='image/svg+xml']",
    "link[rel='icon']",
    "link[rel='apple-touch-icon']",
    "link[rel='apple-touch-icon-precomposed']",
    "link[rel='shortcut icon']",
    "img[alt*='logo']",
    "img[src*='logo']"
  ];

  for (const selector of faviconSelectors) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) continue;

    // Filter for valid elements only
    const elementsArray = Array.from(elements).filter(
      (el) =>
        (el instanceof HTMLLinkElement && el.href) ||
        (el instanceof HTMLImageElement && el.src)
    );

    if (!elementsArray.length) continue;

    // Sort by size when available (larger sizes first)
    elementsArray.sort((a, b) => {
      if (a instanceof HTMLLinkElement && b instanceof HTMLLinkElement) {
        return getLinkSize(b) - getLinkSize(a);
      }
      return 0;
    });

    // Get URL from the first element
    const element = elementsArray[0];
    let url: string | undefined = undefined;

    if (element instanceof HTMLLinkElement) {
      url = getAbsoluteUrl(element.href);
    } else if (element instanceof HTMLImageElement) {
      url = getAbsoluteUrl(element.src);
    }

    if (url) return url;
  }
};

/**
 * Checks if the default favicon exists
 */
const checkDefaultFavicon = async (): Promise<string | undefined> => {
  const defaultFavicon = `${window.location.origin}/favicon.ico`;

  try {
    const response = await fetchWithTimeout(
      defaultFavicon,
      { method: "HEAD" },
      FAVICON_TIMEOUT_MS
    );

    return response.ok ? defaultFavicon : undefined;
  } catch {}
};

/**
 * Gets the app logo from various sources
 * Returns the best quality logo URL or undefined if none found
 */
export async function getAppLogo(): Promise<string | undefined> {
  // Return cached result if available
  if (cachedAppLogo) return cachedAppLogo;

  try {
    // Try each method in order of preference
    const manifestLogo = await getLogoFromManifest();
    if (manifestLogo) {
      cachedAppLogo = manifestLogo;
      return manifestLogo;
    }

    const domLogo = getLogoFromDOM();
    if (domLogo) {
      cachedAppLogo = domLogo;
      return domLogo;
    }

    const defaultLogo = await checkDefaultFavicon();
    cachedAppLogo = defaultLogo;
    return defaultLogo;
  } catch (err) {
    console.error("Error in getAppLogo:", err);
    cachedAppLogo = undefined;
  }
}
