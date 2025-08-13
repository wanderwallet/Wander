import { useMemo, useState } from "react";
import { Image } from "~components/common/Image/Image";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { getUserAvatar } from "~lib/avatar";
import type { Token } from "~tokens/token";
import { AR_LOGO, AR_PROCESS_ID, type TokenInfo } from "~tokens/aoTokens/ao";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";

import arLogoLight from "url:/assets/ar/ar-logo-light.svg";
import arLogoDark from "url:/assets/ar/ar-logo-dark.svg";

function isAr(token: string | Partial<Token>) {
  return typeof token === "string"
    ? token.toUpperCase() === AR_PROCESS_ID || token === AR_LOGO || token.endsWith(AR_LOGO)
    : token.id === AR_PROCESS_ID || token.ticker === "AR" || token.name === "Arweave" || token.defaultLogo === AR_LOGO;
}

function isURI(token: string | Partial<Token>): token is string {
  return typeof token === "string" && (token.startsWith("chrome-extension://") || token.startsWith("https://"));
}

function getTokenFallbackImage(token: string | Partial<Token>, name: string = "") {
  const fallbackSymbol = (typeof token === "object" && token.ticker) || (name.includes(" ") ? "" : name) || "?";

  const fontSize = Math.max(1, 5 - Math.max(0, fallbackSymbol.length - 3) * 0.75);

  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <style>
        @font-face {
          font-family: "Plus Jakarta Sans";
          font-style: normal;
          font-weight: 700;
          src: url(/assets/fonts/PlusJakartaSans-Bold.ttf) format('truetype');
        }

        text {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: bold;
        }
      </style>
      <circle fill="transparent" stroke="#9C9C9C" stroke-width="1px" cx="8px" cy="8px" r="7.5px"></circle>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9C9C9C" font-size="${fontSize}px">${fallbackSymbol}</text>
    </svg>
  `)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");

  return `data:image/svg+xml,${encoded}`;
}

export interface TokenLogoProps {
  /**
   * Valid values:
   * - "AR", case-insensitive.
   * - A `Token.defaultLogo` / `TokenInfo.Logo` value.
   * - A https:// or chrome-extension:// URI.
   *
   * Note all values pointing to the AR logo in one way or another will be handled the same way: Displaying the
   * theme-aware SVG from the repo.
   */
  token: string | Partial<Token> | Partial<TokenInfo>;

  /**
   * Used for the `alt` attribute. Falls back to whatever we can extract from the `token` property, or simply "Token".
   */
  name?: string;

  /**
   * @default 40
   */
  size?: number;

  style?: React.CSSProperties;
}

export function TokenLogo({ token: tokenProp, name, size = 40, style }: TokenLogoProps) {
  const gateway = useGateway(FULL_HISTORY);

  const token = useMemo(() => {
    if (typeof tokenProp !== "object") return tokenProp;

    // TokenInfo has property names that start with uppercase, while Token does not:
    if (Object.keys(tokenProp).every((propName) => propName[0] === propName[0].toLowerCase()))
      return tokenProp as Partial<Token>;

    // Convert TokenInfo to Token:

    const tokenInfo = tokenProp as Partial<TokenInfo>;

    return {
      id: tokenInfo.processId,
      name: tokenInfo.Name,
      ticker: tokenInfo.Ticker,
      type: tokenInfo.type,
      hidden: tokenInfo.hidden,
      decimals: tokenInfo.Denomination,
      defaultLogo: tokenInfo.Logo,
    };
  }, [tokenProp]);

  const [logoSrc, setLogoSrc] = useState<string | null>(() => {
    if (typeof token === "object" && token.type === "collectible") {
      return `${concatGatewayURL(gateway)}/${token.id}`;
    }

    if (isURI(token)) return token;

    return null;
  });

  const [hasError, setHasError] = useState(false);

  useAsyncEffect(async () => {
    // These are handled in the `return` at the bottom:
    if (!token) return;

    // These are handled in the setState init function, but in case the value
    // changes after the first render, here it is again:
    if (typeof token === "object" && token.type === "collectible") {
      setLogoSrc(`${concatGatewayURL(gateway)}/${token.id}`);

      return;
    }

    if (isURI(token)) {
      setLogoSrc(token);

      return;
    }

    // Load the token logo from Arweave using its transaction ID.

    try {
      const logoSrc = await getUserAvatar(typeof token === "object" ? token.defaultLogo : token);

      if (!logoSrc)
        throw new Error(`Could not load logo for ${typeof token === "object" ? token.defaultLogo : token}.`);

      setLogoSrc(logoSrc);
    } catch {
      setHasError(true);

      // TODO: Also show the error state / fallback if there's an error loading the token info on the parent component.
    }
  }, [token]);

  const title = process.env.NODE_ENV === "development" ? `token=${JSON.stringify(token)}, name="${name}"` : undefined;

  const alt =
    typeof token === "object" ? `${name || token.name || token.ticker || "Token"} logo` : `${name || "token"} logo`;

  return isAr(token) ? (
    <Image
      src={arLogoLight}
      srcDark={arLogoDark}
      alt="AR logo"
      title={title}
      width={size}
      height={size}
      fill
      borderRadius="circular"
      style={style}
    />
  ) : (
    <Image
      src={token && !hasError ? logoSrc : getTokenFallbackImage(token, name)}
      alt={alt}
      title={title}
      width={size}
      height={size}
      fill
      borderRadius="circular"
      style={style}
      onError={() => setHasError(true)}
    />
  );
}
