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
  STORAGE = "STORAGE"
}

const LOG_GROUPS_ENABLED: Record<LOG_GROUP, boolean> = {
  [LOG_GROUP.API]: process.env.NODE_ENV === "development",
  [LOG_GROUP.AUTH]: process.env.NODE_ENV === "development",
  [LOG_GROUP.CHUNKS]: false,
  [LOG_GROUP.EMBEDDED_FLOWS]: process.env.NODE_ENV === "development",
  [LOG_GROUP.GATEWAYS]: false,
  [LOG_GROUP.MSG]: false,
  [LOG_GROUP.ROUTING]: false,
  [LOG_GROUP.SETUP]: process.env.NODE_ENV === "development",
  [LOG_GROUP.WALLET_GENERATION]: process.env.NODE_ENV === "development",
  [LOG_GROUP.SESSION]: process.env.NODE_ENV === "development",
  [LOG_GROUP.STORAGE]: process.env.NODE_ENV === "development"
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
