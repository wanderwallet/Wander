export const PARAM_API_KEY = "api-key";
export const PARAM_ORIGIN = "origin";

const searchParams = new URLSearchParams(document.location.search);

export const EMBEDDED_API_KEY = searchParams.get(PARAM_API_KEY);
export const EMBEDDED_PARENT_ORIGIN = searchParams.get(PARAM_ORIGIN);

// TODO: We still need to validate EMBEDDED_API_KEY & EMBEDDED_PARENT_ORIGIN are allowed (e.g. the developer registered
// the app and whitelisted the domain(s) correctly). We should probably use a mechanism like Google Search Console where
// they need to create a file at the root of their domain, or add an HTML tag.

export function getEmbeddedURL(apiKey: string) {
  const base =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173/"
      : "https://embedded-iframe.arconnect.io/";

  const searchParams = new URLSearchParams();

  searchParams.set(EMBEDDED_API_KEY, apiKey);
  searchParams.set(EMBEDDED_PARENT_ORIGIN, window.location.origin);

  return `${base}?${searchParams.toString()}`;
}
