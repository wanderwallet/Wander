import React, { useMemo } from "react";
import styled from "styled-components";
import { isURL } from "~utils/urls/isURL";
import { Button, type ButtonProps } from "@arconnect/components-rebrand";
import type { WanderRoutePath, NavigateFn } from "~wallets/router/router.types";
import browser from "webextension-polyfill";
import { useLocation } from "~wallets/router/router.utils";

interface ParseTextWithLinksProps {
  text: string;
}

interface ButtonOptions {
  variant?: ButtonProps["variant"];
  fullWidth?: ButtonProps["fullWidth"];
}

const REGEX_PATTERNS = {
  BR: /^<br\s*\/?>$/i,
  BR_OR_WS: /(<br\s*\/?>|\s+)/i,
  URL_PREFIX: /^(https?:\/\/|www\.)/,
  TOKEN_PARSER: /\[([^\[\]]*?)\]\(([^)]+)\)(?:\{([^}]+)\})?/,
  OPTION_PARSER: /(\w+)=([^,}]+)/g,
} as const;

const Link = styled.a`
  color: ${({ theme }) => theme.primaryText};
  text-decoration: underline;
  display: inline;
  cursor: pointer;
`;

const parseButtonOptions = (optionsString: string = ""): ButtonOptions => {
  const options: ButtonOptions = {};
  let match: Array<any>;
  while ((match = REGEX_PATTERNS.OPTION_PARSER.exec(optionsString))) {
    const [, key, value] = match;
    if (key === "variant") options.variant = value;
    if (key === "fullWidth") options.fullWidth = value === "true";
  }
  return options;
};

const createButton = (
  text: string,
  navigate: NavigateFn,
  route: string,
  key: number,
  options: ButtonOptions = {},
): React.ReactNode => {
  const isInternal = route.startsWith("/");
  const onClick = isInternal ? () => navigate(route as WanderRoutePath) : () => browser.tabs.create({ url: route });

  return (
    <Button key={key} onClick={onClick} variant={options.variant ?? "primary"} fullWidth={options.fullWidth ?? false}>
      {text}
    </Button>
  );
};

const createLink = (text: string, navigate: NavigateFn, route: string, key: number): React.ReactNode => {
  const isInternal = route.startsWith("/");
  const onClick = isInternal ? () => navigate(route as WanderRoutePath) : () => browser.tabs.create({ url: route });

  return (
    <Link key={key} onClick={onClick}>
      {text}
    </Link>
  );
};

const parseTextContent = (text: string, navigate: NavigateFn): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let key = 0;
  let remaining = text;

  while (remaining.length > 0) {
    const match = remaining.match(REGEX_PATTERNS.TOKEN_PARSER);

    if (match) {
      const before = remaining.slice(0, match.index);
      if (before) (parts.push(...parsePlainText(before, key)), (key += parts.length));

      const [, linkText, route, optionsString] = match;
      if (optionsString?.includes("button")) {
        parts.push(createButton(linkText, navigate, route, key++, parseButtonOptions(optionsString)));
      } else if (optionsString?.includes("link")) {
        parts.push(createLink(linkText, navigate, route, key++));
      } else {
        // Auto-detect: internal = button, external = link
        if (route.startsWith("/")) {
          parts.push(createButton(linkText, navigate, route, key++, { variant: "primary" }));
        } else {
          parts.push(createLink(linkText, navigate, route, key++));
        }
      }

      remaining = remaining.slice((match.index || 0) + match[0].length);
    } else {
      parts.push(...parsePlainText(remaining, key));
      break;
    }
  }

  return parts;
};

const parsePlainText = (text: string, startKey: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let key = startKey;

  for (const segment of text.split(REGEX_PATTERNS.BR_OR_WS)) {
    if (!segment) continue;

    if (segment.match(REGEX_PATTERNS.BR)) {
      parts.push(<br key={key++} />);
    } else if (isURL(segment)) {
      const display = segment.replace(REGEX_PATTERNS.URL_PREFIX, "");
      const href = segment.endsWith(".") ? segment.slice(0, -1) : segment;
      parts.push(
        <Link key={key++} href={href} target="_blank" rel="noopener noreferrer">
          {display}
        </Link>,
      );
    } else {
      parts.push(segment);
    }
  }
  return parts;
};

/**
 * Parses text with markdown-style links and buttons into JSX elements.
 *
 * Syntax:
 * [text](url) - Auto-detects internal routes as buttons, external as links
 * [text](url){button} - Forces button styling
 * [text](url){link} - Forces link styling
 * [text](url){button,variant=type} - Button with variant
 *
 * Also supports:
 * - Plain URLs: Automatically linked
 * - Line breaks: <br> or <br/>
 *
 * Button variants: primary, secondary and secondaryAlt
 *
 * Examples:
 * [View](/path) → Button
 * [Site](https://ex.com) → Link
 * [Button](https://ex.com){button} → Button
 * [Link](/path){link} → Link
 * [Send](/send){button,variant=secondary} → Secondary button
 */
export const ParseTextWithLinks: React.FC<ParseTextWithLinksProps> = React.memo(({ text }) => {
  const { navigate } = useLocation();

  const parsedContent = useMemo(() => {
    if (!text?.trim()) return null;
    return parseTextContent(text, navigate);
  }, [text]);

  return <>{parsedContent}</>;
});
