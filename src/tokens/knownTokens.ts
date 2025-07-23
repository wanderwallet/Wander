interface KnownTokenInfo {
  website?: string;
  socials?: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
}

export const knownTokens: Record<string, KnownTokenInfo> = {
  m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w: {
    website: "https://ao.arweave.net/",
  },
  "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc": {
    website: "https://ao.arweave.net/",
  },
  AR: {
    website: "https://arweave.org/",
  },
  // wAR
  xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10: {
    website: "https://aox.xyz/#/home",
  },
  // ASTRO
  "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8": {
    website: "https://www.astrousd.com/",
  },
  // WNDR
  "7GoQfmSOct_aUOWKM4xbKGg6DzAmOgdKwg8Kf-CbHm4": {
    website: "https://www.wander.app/",
  },
  // PI
  "4hXj_E-5fAKmo4E8KjgQvuDJKAFk9P2grhycVmISDLs": {
    website: "https://ao.arweave.net/#/delegate/",
  },
  // LLAMA
  "pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY": {
    website: "https://llamaland.g8way.io/#/",
  },
  // PIXL
  "DM3FoZUq_yebASPhgd8pEIRIzDW6muXEhxz5-JwbZwo": {
    website: "https://bazar.arweave.net/ ",
  },
  // TRUNK
  wOrb8b_V8QixWyXZub48Ki5B6OIDyf_p1ngoonsaRpQ: {
    website: "https://trunkao.xyz/#/",
  },

  // AGENT
  "8rbAftv7RaPxFjFk5FGUVAVCSjGQB4JHDcb9P9wCVhQ": {
    website: "https://agent.ar.io/#/airdrop",
  },

  // EXP
  aYrCboXVSl1AXL9gPFe3tfRxRf0ZmkOXH65mKT0HHZw: {
    website: "https://ar.io/experience",
    socials: {
      twitter: "https://twitter.com/ar_io_network",
      discord: "https://discord.com/invite/HGG52EtTc2",
    },
  },

  // tARIO
  qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE: {
    website: "https://ar.io/",
    socials: {
      twitter: "https://twitter.com/ar_io_network",
      discord: "https://discord.com/invite/HGG52EtTc2",
    },
  },
};

export const getKnownTokenInfo = (tokenId: string): KnownTokenInfo | undefined => {
  return knownTokens[tokenId];
};
