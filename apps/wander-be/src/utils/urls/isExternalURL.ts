export function isExternalURL(url: string) {
  try {
    const currentOrigin = document.location.origin;
    const urlOrigin = new URL(url).origin;
    return urlOrigin !== currentOrigin;
  } catch {
    return false;
  }
}
