import Parser from "rss-parser";

/**
 * Fetch the RSS feed of arweave.news
 */
export default async function getPermawebNewsFeed(): Promise<PermawebNewsArticle[]> {
  try {
    const parser = new Parser<PermawebNewsFeed>();
    const feed = await parser.parseURL("https://permaweb.news/feed");

    return feed.items;
  } catch {
    return [];
  }
}

export interface PermawebNewsFeed {
  items: PermawebNewsArticle[];
}

export interface PermawebNewsArticle {
  creator: string;
  title: string;
  link: string;
  pubDate: string;
  "content:encoded": string;
  "content:encodedSnippet": string;
  "dc:creator": string;
  comments: string;
  content: string;
  contentSnippet: string;
  guid: string;
  categories: string[];
  isoDate: string;
}
