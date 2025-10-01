import type { TokenInfo } from "~tokens/aoTokens/ao";

export const AR_PROCESS_ID = "AR" as const;
export const WNDR_PROCESS_ID = "7GoQfmSOct_aUOWKM4xbKGg6DzAmOgdKwg8Kf-CbHm4" as const;
export const WAR_PROCESS_ID = "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10" as const;
export const WUSDC_PROCESS_ID = "7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ" as const;
export const PI_PROCESS_ID = "4hXj_E-5fAKmo4E8KjgQvuDJKAFk9P2grhycVmISDLs" as const;
export const EXP_PROCESS_ID = "aYrCboXVSl1AXL9gPFe3tfRxRf0ZmkOXH65mKT0HHZw" as const;
export const ARIO_PROCESS_ID = "qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE" as const;
export const USDA_PROCESS_ID = "FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8" as const;
export const AO_PROCESS_ID = "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc" as const;
export const AO_OLD_PROCESS_ID = "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w" as const;
export const PIXL_PROCESS_ID = "DM3FoZUq_yebASPhgd8pEIRIzDW6muXEhxz5-JwbZwo" as const;
export const TRUNK_PROCESS_ID = "wOrb8b_V8QixWyXZub48Ki5B6OIDyf_p1ngoonsaRpQ" as const;
export const AGENT_PROCESS_ID = "8rbAftv7RaPxFjFk5FGUVAVCSjGQB4JHDcb9P9wCVhQ" as const;
export const LQD_PROCESS_ID = "n2MhPK0O3yEvY2zW73sqcmWqDktJxAifJDrri4qireI" as const;
export const BOTG_PROCESS_ID = "Nx-_Ichdp-9uO_ZKg2DLWPiRlg-DWrSa2uGvINxOjaE" as const;
export const ACTION_PROCESS_ID = "OiNYKJ16jP7uj7z0DJO7JZr9ClfioGacpItXTn9fKn8" as const;
export const PL_PROCESS_ID = "Jc2bcfEbwHFQ-qY4jqm8L5hc-SggeVA1zlW6DOICWgo" as const;
export const SMONEY_PROCESS_ID = "K59Wi9uKXBQfTn3zw7L_t-lwHAoq3Fx-V9sCyOY3dFE" as const;
export const APUS_PROCESS_ID = "mqBYxpDsolZmJyBdTK8TJp_ftOuIUXVYcSQ8MYZdJg0" as const;
export const LOAD_PROCESS_ID = "gx_jKk-hy8-sB4Wv5WEuvTTVyIRWW3We7rRHthcohBQ" as const;
export const VAR_PROCESS_ID = "y-p7CPhs6JMUStAuE4KeTnMXN7qYBvEi2hiBFk8ZhjM" as const;

export const AO_PROCESS_BALANCE_MIRROR = "Pi-WmAQp2-mh-oWH9lWpz5EthlUDj_W0IusAv-RXhRk" as const;
export const AO_AUTHORITY_ID = "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY" as const;

export const VERIFIED_TOKENS = new Set<string>([
  AR_PROCESS_ID,
  WNDR_PROCESS_ID,
  WAR_PROCESS_ID,
  WUSDC_PROCESS_ID,
  PI_PROCESS_ID,
  EXP_PROCESS_ID,
  ARIO_PROCESS_ID,
  USDA_PROCESS_ID,
  AO_PROCESS_ID,
  PIXL_PROCESS_ID,
  TRUNK_PROCESS_ID,
  AGENT_PROCESS_ID,
  LQD_PROCESS_ID,
  BOTG_PROCESS_ID,
  ACTION_PROCESS_ID,
  PL_PROCESS_ID,
  SMONEY_PROCESS_ID,
  APUS_PROCESS_ID,
  LOAD_PROCESS_ID,
]);

export const AR_LOGO = "jZ2XPRj37W-QNb3BwWWIyEelv-7nQjBHg0g6WLX91IM";

export const AR_TOKEN_INFO: TokenInfo = {
  Name: "AR",
  Ticker: "AR",
  Denomination: 12,
  Logo: AR_LOGO,
  processId: AR_PROCESS_ID,
};

export const AO_TOKEN_INFO: TokenInfo = {
  Name: "AO",
  Ticker: "AO",
  Denomination: 12,
  Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
  processId: AO_PROCESS_ID,
};

export const PI_TOKEN_INFO: TokenInfo = {
  Name: "Permaweb Index Token",
  Ticker: "PI",
  Denomination: 12,
  Logo: "zmQwyD6QiZge10OG2HasBqu27Zg0znGkdFRufOq6rv0",
  processId: PI_PROCESS_ID,
};

export const WNDR_TOKEN_INFO: TokenInfo = {
  Name: "Wander",
  Ticker: "WNDR",
  Denomination: 18,
  Logo: "xUO2tQglSYsW89aLYN8ErGivZqezoDaEn95JniaCBZk",
  processId: WNDR_PROCESS_ID,
};

export const USDA_TOKEN_INFO: TokenInfo = {
  Name: "Astro USD",
  Ticker: "USDA",
  Denomination: 12,
  Logo: "seXozJrsP0OgI0gvAnr8zmfxiHHb5iSlI9wMI8SdamE",
  processId: USDA_PROCESS_ID,
};

export const WAR_TOKEN_INFO: TokenInfo = {
  Name: "Wrapped AR",
  Ticker: "wAR",
  Denomination: 12,
  Logo: "L99jaxRKQKJt9CqoJtPaieGPEhJD3wNhR4iGqc8amXs",
  processId: WAR_PROCESS_ID,
};

export const VAR_TOKEN_INFO: TokenInfo = {
  Name: "Vento Arweave",
  Ticker: "vAR",
  Denomination: 12,
  Logo: "XQKXtuxDGDn13z0JBqYvbkNXPu3Y3aE1WaK2XftQ3cA",
  processId: VAR_PROCESS_ID,
};

export const defaultTokens = [
  AR_TOKEN_INFO,
  AO_TOKEN_INFO,
  PI_TOKEN_INFO,
  WNDR_TOKEN_INFO,
  USDA_TOKEN_INFO,
  WAR_TOKEN_INFO,
] as const satisfies TokenInfo[];

export const nonTransferableTokenIds: Array<string> = [EXP_PROCESS_ID];

// Example:
// export const nonTransferableWhitelistedWallets = { [PROCESS_ID]: ["<Wallet Address 1>", "<Wallet Address 2>" ] };
export const nonTransferableWhitelistedWallets = {};

/**
 * Dummy ID
 */
export const Id = "0000000000000000000000000000000000000000001";

/**
 * Dummy owner
 */
export const Owner = "0000000000000000000000000000000000000000002";
