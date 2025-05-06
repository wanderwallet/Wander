import { sortGatewaysByOperatorStake } from "~lib/wayfinder";
import { clGateway, defaultGateway, defaultGateways, goldskyGateway, suggestedGateways, type Gateway } from "./gateway";
import { useEffect, useState } from "react";
import { getGatewayCache } from "./cache";
import { getSetting } from "~settings";
import Arweave from "arweave";

export const FULL_HISTORY: Requirements = { startBlock: 0 };

export const STAKED_GQL_FULL_HISTORY: Requirements = {
  startBlock: 0,
  graphql: true,
  ensureStake: true,
};

export async function findGateway(requirements: Requirements): Promise<Gateway> {
  try {
    const gateway = await getSetting("gateways").getValue<Gateway>();

    // arns or all the chain is needed
    if (requirements.arns || requirements.startBlock === 0) {
      return defaultGateway;
    } else if (requirements.random) {
      // This should have been loaded into the cache by handleGatewayUpdateAlarm
      const gateways = (await getGatewayCache()) || [];

      if (gateways.length === 0) {
        const randomIndex = Math.floor(Math.random() * defaultGateways.length);
        return defaultGateways[randomIndex];
      }

      // this could probably be filtered out during the caching process
      const filteredGateways = gateways.filter((gateway) => {
        return gateway.ping.status === "success" && gateway.health.status === "success";
      });
      const sortedGateways = sortGatewaysByOperatorStake(filteredGateways);
      const otherHosts = [gateway.host, defaultGateway.host, clGateway.host, "aoweave.tech", "defi.ao"];

      const additionalGateways = otherHosts
        .filter((host) => !sortedGateways.some((g) => g.settings.fqdn === host))
        .map((host) => ({
          settings: { port: 443, protocol: "https", fqdn: host },
        }));

      const allGateways = [...sortedGateways, ...additionalGateways];
      const randomIndex = Math.floor(Math.random() * sortedGateways.length);
      const selectedGateway = allGateways[randomIndex];

      return {
        host: selectedGateway.settings.fqdn,
        port: selectedGateway.settings.port,
        protocol: selectedGateway.settings.protocol,
      };
    }

    return gateway;
  } catch (err) {
    console.log("err", err);
  }

  return defaultGateway;
}

/**
 * Gateway hook that uses wayfinder to select the active gateway.
 */
export function useGateway(requirements: Requirements) {
  // currently active gw
  const [activeGateway, setActiveGateway] = useState<Gateway>(defaultGateway);

  useEffect(() => {
    (async () => {
      try {
        // select recommended gateway using wayfinder
        const recommended = await findGateway(requirements);

        setActiveGateway(recommended);
      } catch {}
    })();
  }, [requirements.graphql, requirements.arns, requirements.startBlock, requirements.ensureStake]);

  return activeGateway;
}

export async function findGraphqlGateways(count?: number) {
  try {
    const gateways = await getGatewayCache();

    if (!gateways?.length) {
      return suggestedGateways;
    }

    const filteredGateways = gateways.filter(
      ({ ping, health }) => ping.status === "success" && health.status === "success",
    );

    if (!filteredGateways.length) {
      return suggestedGateways;
    }

    return sortGatewaysByOperatorStake(filteredGateways)
      .filter((gateway: any) => gateway?.properties?.GRAPHQL)
      .slice(0, count || filteredGateways.length)
      .map(({ settings: { fqdn, port, protocol } }) => ({
        host: fqdn,
        port,
        protocol,
      }));
  } catch {
    return suggestedGateways;
  }
}

export function useGraphqlGateways(count?: number) {
  const [graphqlGateways, setGraphqlGateways] = useState<Gateway[]>([]);

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const gateways = await findGraphqlGateways(count);
        const hasDefaultGateway = gateways.some((g) => g.host === defaultGateway.host);
        const hasGoldskyGateway = gateways.some((g) => g.host === goldskyGateway.host);

        const finalGateways = [...gateways];

        if (!hasDefaultGateway) {
          finalGateways.unshift(defaultGateway);
        }

        if (!hasGoldskyGateway) {
          const insertionIndex = Math.min(2, finalGateways.length);
          finalGateways.splice(insertionIndex, 0, goldskyGateway);
        }

        setGraphqlGateways(finalGateways.slice(0, count || finalGateways.length));
      } catch {
        setGraphqlGateways(suggestedGateways);
      }
    };

    fetchGateways();
  }, [count]);

  return graphqlGateways;
}

/**
 * Retries an Arweave operation with different gateways
 * @param operation - Function that takes an Arweave instance and returns a Promise
 * @param options - Retry configuration
 */
export async function retryWithGateways<T>(
  operation: (arweave: Arweave) => Promise<T>,
  { maxAttempts = 3 }: RetryOptions = {},
): Promise<RetryResult<T>> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const gateway = await findGateway({ random: attempt > 1 });

    try {
      const arweave = new Arweave(gateway);
      const result = await operation(arweave);
      return { result, arweave, gateway };
    } catch (error) {
      lastError = error as Error;
      // console.warn(`Gateway attempt ${attempt} failed:`, error);
      if (attempt === maxAttempts) {
        throw new Error(`Gateway operations failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
      }
    }
  }

  throw lastError;
}

type RetryOptions = {
  maxAttempts?: number;
};

type RetryResult<T> = {
  result: T;
  gateway: Gateway;
  arweave: Arweave;
};

export interface Requirements {
  /* Whether the gateway should be selected randomly */
  random?: boolean;
  /* Whether the gateway should support GraphQL requests */
  graphql?: boolean;
  /* Should the gateway support ArNS */
  arns?: boolean;
  /**
   * The block where the gateway should start syncing data from.
   * Set for 0 to include all blocks.
   * If undefined, wayfinder will not ensure that the start block
   * is 0.
   */
  startBlock?: number;
  /**
   * Ensure that the gateway has a high stake. This is required
   * with data that is important to be accurate. If true, wayfinder
   * will make sure that the gateway stake is higher than the
   * average stake of ar.io nodes.
   */
  ensureStake?: boolean;
}
