import { createContext } from "react";
import { Tag } from "arweave/web/lib/transaction";

export interface Config {
  CU_URL: string;
  MU_URL: string;
  GATEWAY_URL?: string;
}

export const defaultConfig: {
  MODE: "legacy";
  GATEWAY_URL?: string;
  GRAPHQL_URL?: string;
  GRAPHQL_MAX_RETRIES?: number;
  GRAPHQL_RETRY_BACKOFF?: number;
  MU_URL?: string;
  CU_URL?: string;
} = {
  MODE: "legacy",
  CU_URL: "https://cu.ao-testnet.xyz",
  MU_URL: "https://mu.ao-testnet.xyz",
  GATEWAY_URL: "https://g8way.io:443",
};

export const ConfigContext = createContext<[Config, (val: Config) => void]>([] as any);

export const ROUTER_PROCESS = "65W4Cvh0i8Ui3Dwj17rUq9ZDSHfnwPjotoIcCiBF9Rk";

export interface Message {
  Anchor: string;
  Tags: Tag[];
  Target: string;
  Data: string;
}
