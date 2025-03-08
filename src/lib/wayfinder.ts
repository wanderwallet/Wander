import type { Requirements } from "~gateways/wayfinder";
import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import type {
  GatewayAddressRegistryItem,
  GatewayAddressRegistryItemData
} from "~gateways/types";
import { log, LOG_GROUP } from "~utils/log/log.utils";

const pingStaggerDelayMs = 10; // 0.01s
const pingTimeout = 5000; // 5s

const properties = {
  FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44: {
    GRAPHQL: true,
    ARNS: true,
    MAX_PAGE_SIZE: 5000
  },
  "raJgvbFU-YAnku-WsupIdbTsqqGLQiYpGzoqk9SCVgY": {
    GRAPHQL: true,
    ARNS: true,
    MAX_PAGE_SIZE: 1000
  }
};

async function pingUpdater(
  data: GatewayAddressRegistryItem[],
  onUpdate: (garItemsWithChecks: GatewayAddressRegistryItem[]) => void
): Promise<void> {
  const CLabs = "CDoilQgKg6Pmp4Q0LJ4d84VXRgB3Ay9pIJ_SA617cVk";
  const CLabsGateway = data.find((item) => item.id === CLabs);

  let newData = structuredClone(data)
    .sort((a, b) => b.operatorStake - a.operatorStake)
    .slice(0, 5);

  if (CLabsGateway && !newData.some((item) => item.id === CLabs)) {
    newData.push(CLabsGateway);
  }

  const pingPromises = newData.map((item, index) => async () => {
    const delayMs = pingStaggerDelayMs * index;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      newData[index].ping = { status: "pending" };
      onUpdate(newData);

      const url = `${item.linkFull}/ar-io/healthcheck`;
      const controller = new AbortController();
      const timeoutTrigger = setTimeout(() => controller.abort(), pingTimeout);

      const start = Date.now();
      const fetchResult = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-cache"
      });
      const end = Date.now();
      const duration = end - start;

      clearTimeout(timeoutTrigger);
      newData[index].ping = { status: "success", value: duration };

      onUpdate(newData);

      try {
        newData[index].health = { status: "pending" };
        onUpdate(newData);

        const healthJson = await fetchResult.json();
        const propertyTxn = newData[index].settings.properties;

        newData[index].health = {
          status: "success"
        };
        // Save txn properties, hardcoded
        newData[index].properties = properties[propertyTxn];

        onUpdate(newData);
      } catch (e) {
        log(LOG_GROUP.GATEWAYS, "Gateway health check error", e);

        newData[index].health = {
          status: "error",
          error: e?.toString() ?? JSON.stringify(e)
        };

        onUpdate(newData);
      }
    } catch (e) {
      log(LOG_GROUP.GATEWAYS, "Gateway ping check error", e);

      newData[index].ping = {
        status: "error",
        error: e?.toString() ?? JSON.stringify(e)
      };
      newData[index].health = {
        status: "error"
      };

      onUpdate(newData);
    }
  });

  await Promise.all(pingPromises.map((p) => p()));
}

// TODO: MAKE THIS WEIGH HTTP/HTTPS
const sortGatewaysByOperatorStake = (
  filteredGateways: GatewayAddressRegistryItem[]
) => {
  const sortedGateways = filteredGateways.slice();

  sortedGateways.sort((gatewayA, gatewayB) => {
    const protocolA = gatewayA.settings.protocol;
    const protocolB = gatewayB.settings.protocol;

    // If gatewayA is HTTPS and gatewayB is HTTP, put gatewayA first
    if (protocolA === "https" && protocolB === "http") {
      return -1;
    }

    // If gatewayA is HTTP and gatewayB is HTTPS, put gatewayB first
    if (protocolA === "http" && protocolB === "https") {
      return 1;
    }

    // If both have the same protocol, compare by operatorStake
    return gatewayB.operatorStake - gatewayA.operatorStake;
  });

  return sortedGateways;
};

const fetchGatewayProperties = async (txn) => {
  const arweave = new Arweave(defaultGateway);
  const transaction = await arweave.transactions.getData(txn, {
    decode: true,
    string: true
  });
  const properties = JSON.parse(transaction as string);

  if (properties.GRAPHQL && properties.ARNS) {
    return transaction;
  } else {
    return null;
  }
};

const isValidGateway = (gateway: any, requirements: Requirements): boolean => {
  if (requirements.graphql && !gateway?.properties?.GRAPHQL) {
    return false;
  }
  if (requirements.arns && !gateway?.properties?.ARNS) {
    return false;
  }
  if (
    requirements.startBlock !== undefined &&
    gateway.start > requirements.startBlock
  ) {
    return false;
  }
  return true;
};

// FOR CACHING AND GETTING STATUS
function extractGarItems(
  gateways: GatewayAddressRegistryItemData[]
): GatewayAddressRegistryItem[] {
  return gateways.map((item) => {
    return {
      id: item.gatewayAddress,
      ping: { status: "unknown" },
      health: { status: "unknown" },
      linkFull: linkFull(
        item.settings.protocol,
        item.settings.fqdn,
        item.settings.port
      ),
      linkDisplay: linkDisplay(
        item.settings.protocol,
        item.settings.fqdn,
        item.settings.port
      ),
      ...item
    };
  });
}

const linkFull = (protocol: string, fqdn: string, port: number) =>
  `${protocol}://${fqdn}:${port}`;

const linkDisplay = (protocol: string, fqdn: string, port: number) => {
  if (protocol === "https" && port === 443) return fqdn;
  if (protocol === "http" && port === 80) return `http://${fqdn}`;
  return linkFull(protocol, fqdn, port);
};

export {
  pingUpdater,
  extractGarItems,
  isValidGateway,
  linkFull,
  linkDisplay,
  sortGatewaysByOperatorStake,
  fetchGatewayProperties
};
