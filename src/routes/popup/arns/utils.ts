import { unicodeToAscii, asciiToUnicode } from "puny-coder";

export function encodeDomainToASCII(domain: string): string {
  const decodedDomain = unicodeToAscii(domain);

  return decodedDomain;
}
export function decodeDomainToASCII(domain: string): string {
  const decodedDomain = asciiToUnicode(domain);

  return decodedDomain;
}

export function lowerCaseDomain(domain: string) {
  return encodeDomainToASCII(decodeURIComponent(domain.trim())).toLowerCase();
}
