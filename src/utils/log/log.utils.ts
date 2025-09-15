export enum LOG_GROUP {
  API = "API",
  AUTH = "AUTH",
  CHUNKS = "CHUNKS",
  EMBEDDED_FLOWS = "EMBEDDED_FLOWS",
  GATEWAYS = "GATEWAYS",
  MSG = "MSG",
  ROUTING = "ROUTING",
  SETUP = "SETUP",
  WALLET_GENERATION = "WALLET_GENERATION",
  SESSION = "SESSION",
  STORAGE = "STORAGE",
  AGENTS = "AGENTS",
  TIERS = "TIERS",
  TRANSAK = "TRANSAK",
  FAIR_LAUNCH = "FAIR_LAUNCH",
  TRANSACTIONS = "TRANSACTIONS",
  EARN = "EARN",
  SWAP = "SWAP",
  ARNS = "ARNS",
}

const LOG_GROUPS_ENABLED: Record<LOG_GROUP, boolean> = {
  [LOG_GROUP.API]: false,
  [LOG_GROUP.AUTH]: true,
  [LOG_GROUP.CHUNKS]: false,
  [LOG_GROUP.EMBEDDED_FLOWS]: false,
  [LOG_GROUP.GATEWAYS]: false,
  [LOG_GROUP.MSG]: false,
  [LOG_GROUP.ROUTING]: false,
  [LOG_GROUP.SETUP]: false,
  [LOG_GROUP.WALLET_GENERATION]: false,
  [LOG_GROUP.SESSION]: false,
  [LOG_GROUP.STORAGE]: false,
  [LOG_GROUP.AGENTS]: false,
  [LOG_GROUP.TIERS]: false,
  [LOG_GROUP.TRANSAK]: false,
  [LOG_GROUP.FAIR_LAUNCH]: false,
  [LOG_GROUP.TRANSACTIONS]: false,
  [LOG_GROUP.EARN]: false,
  [LOG_GROUP.SWAP]: process.env.NODE_ENV === "development",
  [LOG_GROUP.ARNS]: process.env.NODE_ENV === "development",
};

function getColor() {
  const { pathname } = location;

  if (pathname.includes("auth.html")) {
    return "color: yellow;";
  }

  return "color: inherit;";
}

export function log(logGroup: LOG_GROUP, ...args: any) {
  if (!LOG_GROUPS_ENABLED[logGroup]) return;

  const prefix = location.protocol === "chrome-extension:" ? "" : "[Wander] ";

  console.log(`${prefix}%c[${logGroup}]`, getColor(), ...args);
}
