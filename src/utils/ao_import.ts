import type { TokenInfo } from "~tokens/aoTokens/ao";

// export const AO_NATIVE_OLD_TOKEN = "BJj8sNao3XPqsoJnea4DnJyPzHnKhkhcY1HtWBxHcLs" as const;
export const AO_NATIVE_OLD_TOKEN = "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w" as const;
export const AO_NATIVE_TOKEN = "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc" as const;
export const EXP_TOKEN = "aYrCboXVSl1AXL9gPFe3tfRxRf0ZmkOXH65mKT0HHZw" as const;
export const AO_NATIVE_TOKEN_BALANCE_MIRROR = "Pi-WmAQp2-mh-oWH9lWpz5EthlUDj_W0IusAv-RXhRk" as const;

export const AO_NATIVE_TOKEN_INFO = {
  Name: "AO",
  Ticker: "AO",
  Denomination: 12,
  Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
  processId: AO_NATIVE_TOKEN,
} as const satisfies TokenInfo;
