import React, { useMemo } from "react";
import styled from "styled-components";
import { isURL } from "~utils/urls/isURL";

interface ParseTextWithLinksProps {
  text: string;
}

const Link = styled.a`
  color: ${({ theme }) => theme.theme};
  text-decoration: none;
  display: inline;
`;

const parseNonLinkText = (text: string, startKey: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let key = startKey;

  // Split by spaces and line breaks but preserve them
  const tokens = text.split(/(\s+|<br\s*\/?>)/i);

  for (const token of tokens) {
    if (token.match(/<br\s*\/?>$/i)) {
      parts.push(<br key={key++} />);
    } else if (token.match(/^\s+$/)) {
      parts.push(token); // Preserve whitespace
    } else if (token.trim()) {
      // Check for regular URLs
      const isLink = isURL(token);
      if (isLink) {
        const displayText = token.replace(/^(https?:\/\/|www\.)/, "");
        const href = token.endsWith(".") ? token.slice(0, -1) : token;
        parts.push(
          <Link key={key++} href={href} target="_blank" rel="noopener noreferrer">
            {displayText}
          </Link>,
        );
      } else {
        parts.push(token);
      }
    }
  }

  return parts;
};

const parseTextContent = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for markdown links first
    const mdLinkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);
    if (mdLinkMatch) {
      const beforeLink = remaining.substring(0, mdLinkMatch.index);
      if (beforeLink) {
        parts.push(...parseNonLinkText(beforeLink, key));
        key += beforeLink.split(/(\s+|<br\s*\/?>)/i).length;
      }

      const [fullMatch, linkText, url] = mdLinkMatch;
      parts.push(
        <Link key={key++} href={url} target="_blank" rel="noopener noreferrer">
          {linkText}
        </Link>,
      );

      remaining = remaining.substring((mdLinkMatch.index || 0) + fullMatch.length);
    } else {
      // No more markdown links, parse remaining text
      parts.push(...parseNonLinkText(remaining, key));
      break;
    }
  }

  return parts;
};

/**
 * Parses text containing markdown links, regular URLs, and HTML line breaks
 * and returns JSX elements
 */
export const ParseTextWithLinks: React.FC<ParseTextWithLinksProps> = ({ text }) => {
  const parsedContent = useMemo(() => parseTextContent(text), [text]);

  return <>{parsedContent}</>;
};
