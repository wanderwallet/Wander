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

export function formatArio(amount: number) {
  return amount > 1000000
    ? `${(amount / 1000000).toFixed(2)}M`
    : amount > 1000
      ? `${(amount / 1000).toFixed(2)}K`
      : amount.toFixed(2);
}
