interface KnownTokenInfo {
  website?: string;
  socials?: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
}

export const knownTokens: Record<string, KnownTokenInfo> = {
  AR: {
    website: "https://arweave.org/",
    socials: {
      twitter: "https://x.com/ArweaveEco",
    },
  },
  // AO
  "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc": {
    website: "https://ao.arweave.net/",
    socials: {
      twitter: "https://x.com/aoTheComputer",
    },
  },
  // wAR
  xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10: {
    website: "https://aox.xyz/#/home",
    socials: {
      twitter: "https://twitter.com/aox_xyz",
    },
  },
  // ASTRO
  "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8": {
    website: "https://www.astrousd.com/",
  },
  // WNDR
  "7GoQfmSOct_aUOWKM4xbKGg6DzAmOgdKwg8Kf-CbHm4": {
    website: "https://www.wander.app/",
    socials: {
      twitter: "https://x.com/usewander",
      discord: "https://discord.com/invite/YGXJbuz44K",
    },
  },
  // PI
  "4hXj_E-5fAKmo4E8KjgQvuDJKAFk9P2grhycVmISDLs": {
    website: "https://www.autonomous.finance/research/en-US/permaweb-index",
    socials: {
      twitter: "https://x.com/autonomous_af",
    },
  },
  // LLAMA
  "pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY": {
    website: "https://llamaland.g8way.io/#/",
  },
  // PIXL
  "DM3FoZUq_yebASPhgd8pEIRIzDW6muXEhxz5-JwbZwo": {
    website: "https://bazar.arweave.net/",
    socials: {
      twitter: "https://x.com/OurBazAR",
    },
  },
  // TRUNK
  wOrb8b_V8QixWyXZub48Ki5B6OIDyf_p1ngoonsaRpQ: {
    website: "https://trunkao.xyz/#/",
    socials: {
      twitter: "https://x.com/trunktoken",
    },
  },

  // AGENT
  "8rbAftv7RaPxFjFk5FGUVAVCSjGQB4JHDcb9P9wCVhQ": {
    website: "https://agent.ar.io/#/airdrop",
    socials: {
      twitter: "https://x.com/autonomous_af",
    },
  },

  // EXP
  aYrCboXVSl1AXL9gPFe3tfRxRf0ZmkOXH65mKT0HHZw: {
    website: "https://ar.io/experience",
    socials: {
      twitter: "https://twitter.com/ar_io_network",
      discord: "https://discord.com/invite/HGG52EtTc2",
    },
  },

  // ARIO
  qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE: {
    website: "https://ar.io/",
    socials: {
      twitter: "https://x.com/ar_io_network",
      discord: "https://discord.com/invite/HGG52EtTc2",
    },
  },

  // USDA
  "FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8": {
    website: "https://www.astrousd.com/",
    socials: {
      twitter: "https://x.com/AstroUSD",
    },
  },

  // LQD
  n2MhPK0O3yEvY2zW73sqcmWqDktJxAifJDrri4qireI: {
    website: "https://liquidops.io/",
    socials: {
      twitter: "https://x.com/Liquid_Ops",
    },
  },

  // BOTG
  "Nx-_Ichdp-9uO_ZKg2DLWPiRlg-DWrSa2uGvINxOjaE": {
    website: "https://botega.arweave.net/#/swap",
    socials: {
      twitter: "https://x.com/Botega_AF",
    },
  },

  // ACTION
  OiNYKJ16jP7uj7z0DJO7JZr9ClfioGacpItXTn9fKn8: {
    website: "https://basejump.xyz/home",
    socials: {
      twitter: "https://x.com/basejumpxyz",
    },
  },

  // PL
  "Jc2bcfEbwHFQ-qY4jqm8L5hc-SggeVA1zlW6DOICWgo": {
    website: "https://protocol.land/",
    socials: {
      twitter: "https://x.com/ProtocolLand",
    },
  },

  // SMONEY
  "K59Wi9uKXBQfTn3zw7L_t-lwHAoq3Fx-V9sCyOY3dFE": {
    website: "https://stargrid.ar.io/",
    socials: {
      twitter: "https://x.com/StarGridBattle",
    },
  },

  // APUS
  mqBYxpDsolZmJyBdTK8TJp_ftOuIUXVYcSQ8MYZdJg0: {
    website: "https://www.apus.network/",
    socials: {
      twitter: "https://x.com/apus_network",
    },
  },

  // LOAD
  "gx_jKk-hy8-sB4Wv5WEuvTTVyIRWW3We7rRHthcohBQ": {
    website: "https://www.load.network/",
    socials: {
      twitter: "https://x.com/useload",
    },
  },

  // wUSDC
  "7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ": {
    website: "https://aox.xyz/#/home",
    socials: {
      twitter: "https://twitter.com/aox_xyz",
    },
  },
};

export const getKnownTokenInfo = (tokenId: string): KnownTokenInfo | undefined => {
  return knownTokens[tokenId];
};
