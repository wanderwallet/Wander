export * from "./lib/common/messaging.types";
export * from "./lib/common/messaging.utils";
export * from "./lib/strategies/iframe/iframe-chunking.strategy";
export * from "./lib/strategies/iframe/iframe-messaging.strategy";

// For TypeScript, it doesn't mater what strategy we export. However, each app should add a custom alias in is own
// `vite.config.ts` file to point to the right strategy.
