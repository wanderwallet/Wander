import { concatGatewayURL } from "~gateways/utils";
import { findGateway } from "~gateways/wayfinder";
import type { NameServiceProfile } from "./types";

/**
 * Get the ANS profile for an address
 *
 * @param address Address to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfile(address: string): Promise<AnsUser> {
  // TODO: Fix this just like in Othent:
  try {
    const user = await (
      await fetch(`http://ans-stats.decent.land/profile/${address}`)
    ).json();

    return user;
  } catch {
    return undefined;
  }
}

/**
 * Get the ANS profiles for a list of addresses
 *
 * @param address Address to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfiles(addresses: string[]): Promise<AnsUser[]> {
  const { res } = await (
    await fetch("https://ans-stats.decent.land/users")
  ).json();

  return res.filter(({ user }) => addresses?.includes(user));
}

/**
 * Get the ANS profile for a label
 *
 * @param label Label to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfileByLabel(label: string): Promise<AnsUser> {
  try {
    const user = await (
      await fetch(`http://ans-stats.decent.land/profile/${label}`)
    ).json();

    return user;
  } catch {
    return undefined;
  }
}

/**
 * Checks if search has .ar appended to the end
 * If so, it is an ANS address and can call getAnsProfileByLabel()
 * @param label string to fetch profile for
 */

export const isANS = (label: string): boolean => {
  const lastThreeLetters = label.slice(-3);
  return lastThreeLetters === ".ar";
};

export async function getAnsNameServiceProfile(
  query: string
): Promise<NameServiceProfile | undefined> {
  if (!query) {
    return undefined;
  }

  const profile = await getAnsProfile(query);
  const gateway = await findGateway({ startBlock: 0 });

  return !profile
    ? undefined
    : {
        address: profile.user,
        name: profile.currentLabel + ".ar",
        logo: profile.avatar
      };
}

export interface AnsUsers {
  res: AnsUser[];
}

export interface AnsUser {
  user: string;
  currentLabel: string;
  ownedLabels: {
    label: string;
    scarcity: string;
    acquisationBlock: number;
    mintedFor: 3;
  }[];
  nickname: string;
  address_color: string;
  bio: string;
  url?: string;
  avatar: string;
  earnings?: number;
  links: {
    github: string;
    twitter: string;
    customUrl: string;
    [platform: string]: string;
  };
  subdomains: any; // TODO
  freeSubdomains: number;
}

/**
 * Parse the cover image from the article HTML content
 *
 * @param content HTML content of the article
 * @returns Cover image link
 */
export function parseCoverImageFromContent(content: string) {
  // create simulated dom
  const wrapper = document.createElement("div");
  wrapper.innerHTML = content;

  // find cover image element
  const coverElement = wrapper.getElementsByTagName("img")[0];

  return coverElement?.src;
}
