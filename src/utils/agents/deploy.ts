import { connect } from "@permaweb/aoconnect";
import type { AosConfig, DeployConfig, DeployResult, Services } from "./types";
import { APP_NAME, defaultServices } from "./constants";
import { Logger } from "./logger";
import { getArweave, isArweaveAddress, isCronPattern, isUrl, parseToInt, pollForProcessSpawn } from "./utils";
import { ExtensionStorage } from "~utils/storage";
import { getActiveKeyfile } from "~wallets";
import { createDataItemSigner } from "~tokens/aoTokens/ao";
import { retryWithDelay } from "~utils/promises/retry";
import { AOS_QUERY } from "./queries";

/**
 * Manages deployments of contracts to AO.
 */
export class DeploymentsManager {
  #cachedAosConfig: AosConfig | null = null;

  #validateServices(services?: Services) {
    // Validate and use provided URLs or fall back to defaults
    const { gatewayUrl, cuUrl, muUrl } = services ?? {};

    services = {
      gatewayUrl: isUrl(gatewayUrl) ? gatewayUrl : defaultServices.gatewayUrl,
      cuUrl: isUrl(cuUrl) ? cuUrl : defaultServices.cuUrl,
      muUrl: isUrl(muUrl) ? muUrl : defaultServices.muUrl,
    };

    return services;
  }

  #getAoInstance(services: Services) {
    if (
      (!services.cuUrl || services.cuUrl === defaultServices.cuUrl) &&
      (!services.gatewayUrl || services.gatewayUrl === defaultServices.gatewayUrl) &&
      (!services.muUrl || services.muUrl === defaultServices.muUrl)
    ) {
      return connect({
        GATEWAY_URL: defaultServices.gatewayUrl,
        MU_URL: defaultServices.muUrl,
        CU_URL: defaultServices.cuUrl,
      });
    }

    return connect({
      GATEWAY_URL: services.gatewayUrl,
      MU_URL: services.muUrl,
      CU_URL: services.cuUrl,
    });
  }

  async #getAosConfig() {
    if (this.#cachedAosConfig) {
      return this.#cachedAosConfig;
    }

    const defaultDetails = {
      module: "JArYBF-D8q2OmZ4Mok00sD2Y_6SYEQ7Hjx-6VZ_jl3g",
      sqliteModule: "33d-3X8mpv6xYBlVB-eXMrPfH5Kzf6Hiwhcv0UA10sw",
      scheduler: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
      authority: "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY",
    };

    try {
      const response = await fetch("https://raw.githubusercontent.com/pawanpaudel93/ao-deploy-config/main/config.json");
      const config = (await response.json()) as AosConfig;
      this.#cachedAosConfig = {
        module: config?.module || defaultDetails.module,
        sqliteModule: config?.sqliteModule || defaultDetails.sqliteModule,
        scheduler: config?.scheduler || defaultDetails.scheduler,
        authority: defaultDetails.authority,
      };
      return this.#cachedAosConfig;
    } catch {
      return defaultDetails;
    }
  }

  async #findProcess(name: string, owner: string, retry: DeployConfig["retry"], gateway: string) {
    const processId = await retryWithDelay(
      async () => {
        const res = await getArweave(gateway).api.post("/graphql", {
          query: AOS_QUERY,
          variables: { owners: [owner], names: [name] },
        });
        if (!res.ok || res?.data?.data === null) {
          throw new Error(`(${res.status}) ${res.statusText} - GraphQL ERROR`);
        }
        return res?.data?.data?.transactions?.edges?.[0]?.node?.id;
      },
      retry?.count,
      retry?.delay,
    );

    return processId;
  }

  #validateCron(cron: string) {
    const isCronValid = isCronPattern(cron);
    if (!isCronValid) {
      throw new Error("Invalid cron flag!");
    }
  }

  /**
   * Deploys or updates a contract on AO.
   * @param {DeployConfig} deployConfig - Configuration options for the deployment.
   * @returns {Promise<DeployResult>} The result of the deployment.
   */
  async deployContract({
    name,
    contractPath,
    tags,
    cron,
    module,
    scheduler,
    retry,
    configName,
    processId,
    services,
    onBoot,
    silent = false,
    forceSpawn = false,
  }: DeployConfig): Promise<DeployResult> {
    name = name || "ao-yield-agent";
    configName = configName || name;
    retry = {
      count: parseToInt(retry?.count, 10),
      delay: parseToInt(retry?.delay, 3000),
    };

    const logger = new Logger(configName, silent);
    const aosConfig = await this.#getAosConfig();
    module = isArweaveAddress(module) ? module! : aosConfig.module;
    scheduler = isArweaveAddress(scheduler) ? scheduler! : aosConfig.scheduler;

    const owner = await ExtensionStorage.get("active_address");
    const wallet = await getActiveKeyfile();

    if (wallet.type === "hardware") {
      throw new Error("AO Yield Agents are not supported on hardware wallets.");
    }

    const signer = createDataItemSigner(wallet.keyfile);
    services = this.#validateServices(services);

    // Initialize the AO instance with validated URLs
    const aoInstance = this.#getAoInstance(services);

    let isNewProcess = forceSpawn;

    if (!forceSpawn && (!processId || (processId && !isArweaveAddress(processId)))) {
      processId = await this.#findProcess(name, owner, retry, services.gatewayUrl!);
      isNewProcess = !processId;
    }

    if (!contractPath) {
      throw new Error("Please provide either a valid contract path.");
    }

    const contractSrc = await (await fetch(contractPath)).text();

    if (isNewProcess) {
      logger.log("Spawning new process...", false, true);
      tags = Array.isArray(tags) ? tags : [];
      tags = [
        { name: "App-Name", value: APP_NAME },
        { name: "Name", value: name },
        { name: "aos-Version", value: "2.0.4" },
        { name: "Authority", value: aosConfig.authority },
        ...tags,
      ];

      if (onBoot) {
        tags = [...tags, { name: "On-Boot", value: "Data" }];
      }

      if (cron) {
        this.#validateCron(cron);
        tags = [...tags, { name: "Cron-Interval", value: cron }, { name: "Cron-Tag-Action", value: "Cron" }];
      }

      const data = onBoot ? contractSrc : "1984";
      processId = await retryWithDelay(
        () => aoInstance.spawn({ module, signer, tags, data, scheduler }),
        retry.count,
        retry.delay,
      );

      await pollForProcessSpawn({
        processId,
        gatewayUrl: services.gatewayUrl,
      });

      if (onBoot) {
        return { name, processId, isNewProcess, configName };
      }
    }

    let messageId: string;
    if (!onBoot || !isNewProcess) {
      if (!isNewProcess) {
        logger.log("Updating existing process...", false, true);
      }
      // Load contract to process
      messageId = await retryWithDelay(
        async () =>
          aoInstance.message({
            process: processId!,
            tags: [{ name: "Action", value: "Eval" }],
            data: contractSrc,
            signer,
          }),
        retry.count,
        retry.delay,
      );

      const { Output, Error: error } = await retryWithDelay(
        async () =>
          aoInstance.result({
            process: processId!,
            message: messageId,
          }),
        retry.count,
        retry.delay,
      );

      let errorMessage = null;

      if (Output?.data?.output) {
        errorMessage = Output.data.output;
      } else if (error) {
        if (typeof error === "object" && Object.keys(error).length > 0) {
          errorMessage = JSON.stringify(error);
        } else {
          errorMessage = String(error);
        }
      }

      if (errorMessage) {
        throw new Error(errorMessage);
      }
    }

    return {
      name,
      processId: processId!,
      messageId: messageId!,
      isNewProcess,
      configName,
    };
  }
}

/**
 * Deploys or updates a contract on AO.
 * @param {DeployConfig} deployConfig - Configuration options for the deployment.
 * @returns {Promise<DeployResult>} The result of the deployment.
 */
export async function deployContract(deployConfig: DeployConfig): Promise<DeployResult> {
  const manager = new DeploymentsManager();
  return manager.deployContract(deployConfig);
}
