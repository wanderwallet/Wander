import { gqlAll } from "~gateways/api";
import { AO_YIELD_AGENT_SYNC_QUERY } from "./queries";
import { getAOYieldAgentInfo, getAOYieldAgents, setAOYieldAgents, updateAOYieldAgent } from "./utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { HAS_SHOWN_AGENTS_EXPLAINER_POPUP, SHOW_CREATE_WANDER_AGENT_CTA } from "./constants";
import browser from "webextension-polyfill";
import type { AOYieldAgent, AOYieldAgentInfo } from "./types";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { pLimit } from "plimit-lit";
import { ExtensionStorage } from "~utils/storage";
import { queryClient } from "~utils/tanstack";
import { getTagValue } from "~tokens/aoTokens/ao";
import { createStorageArray } from "~routes/popup/swap/utils/storage/storage.array";

interface AgentSyncConfig {
  retryAttempts: number;
  retryDelayMs: number;
  alarmName: string;
}

type SyncTrigger = "alarm" | "manual";

const STORAGE_KEYS = {
  SYNC_QUEUE: "ao_yield_agent_sync_queue",
  ACTIVE_SYNCS: "ao_yield_agent_active_syncs",
};

class AgentSyncManager {
  private static instance: AgentSyncManager | null = null;
  private syncQueue = createStorageArray<string>(STORAGE_KEYS.SYNC_QUEUE, { preventDuplicates: true });
  private activeSyncs = createStorageArray<string>(STORAGE_KEYS.ACTIVE_SYNCS, { preventDuplicates: true });
  private isProcessingQueue = false;
  private config: AgentSyncConfig;
  private limit = pLimit(10);
  private isInitialized = false;

  private constructor() {
    this.config = {
      retryAttempts: 3,
      retryDelayMs: 2000,
      alarmName: "ao_yield_agent_sync_alarm",
    };
  }

  public static getInstance(): AgentSyncManager {
    if (!AgentSyncManager.instance) {
      AgentSyncManager.instance = new AgentSyncManager();
    }
    return AgentSyncManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    log(LOG_GROUP.AGENTS_SYNC, "Initializing AgentSyncManager...");

    const queueSize = await this.syncQueue.length();
    const activeSyncsSize = await this.activeSyncs.length();

    // Check if alarm exists - if not, no sync is scheduled/running, safe to clear stale active syncs
    const existingAlarm = await browser.alarms.get(this.config.alarmName);

    if (!existingAlarm && !this.isProcessingQueue) {
      // No alarm and no local processing - clean up stale active syncs
      if (activeSyncsSize > 0) {
        log(LOG_GROUP.AGENTS_SYNC, `Clearing ${activeSyncsSize} stale active syncs (no alarm, no processing)`);
        await this.activeSyncs.clear();
      }
      log(LOG_GROUP.AGENTS_SYNC, "No alarm found and no sync is in progress, cleared stale state");
    }

    // Log restored addresses if any
    if (queueSize > 0) {
      log(LOG_GROUP.AGENTS_SYNC, `Restored ${queueSize} addresses from persistent queue`);
    }
    if (activeSyncsSize > 0) {
      log(LOG_GROUP.AGENTS_SYNC, `Restored ${activeSyncsSize} active syncs from storage`);
    }

    this.isInitialized = true;
    log(LOG_GROUP.AGENTS_SYNC, "Initialization complete");
  }

  // Entry point for scheduling agent sync (called when adding/importing wallets)
  public async scheduleAgentsSync(addresses: string[]): Promise<void> {
    if (IS_EMBEDDED_APP) return;

    await this.initialize(); // Ensure initialized

    log(LOG_GROUP.AGENTS_SYNC, `Scheduling sync for ${addresses.length} addresses:`, addresses);

    // Add addresses to sync queue (automatically persists)
    const initialSize = await this.syncQueue.length();
    const validAddresses = addresses.filter((addr) => addr && addr.trim()).map((addr) => addr.trim());
    await this.syncQueue.push(...validAddresses);

    const newSize = await this.syncQueue.length();
    const newAddresses = newSize - initialSize;
    log(LOG_GROUP.AGENTS_SYNC, `Added ${newAddresses} new addresses. Queue size: ${newSize}`);

    // Setup instant one-time alarm (fires immediately, works even if extension closes)
    if (newSize > 0 && !this.isProcessingQueue) {
      await this.setupAlarm();
    }
  }

  // Process the sync queue
  private async processQueueIfNeeded(trigger: SyncTrigger): Promise<void> {
    const queueSize = await this.syncQueue.length();

    if (this.isProcessingQueue) {
      log(LOG_GROUP.AGENTS_SYNC, `Skipping ${trigger} sync - another sync is already in progress`);
      return;
    }

    if (queueSize === 0) {
      log(LOG_GROUP.AGENTS_SYNC, `Skipping ${trigger} sync - queue is empty`);
      return;
    }

    // Set local processing flag
    this.isProcessingQueue = true;

    try {
      log(LOG_GROUP.AGENTS_SYNC, `Processing queue (${queueSize} addresses) - trigger: ${trigger}`);

      const addressesToProcess = await this.syncQueue.getAll();
      const results = await Promise.allSettled(addressesToProcess.map((address) => this.syncAgentsForAddress(address)));

      // Process results and remove successful syncs from queue
      let successCount = 0;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const address = addressesToProcess[i];
        if (result.status === "fulfilled") {
          await this.syncQueue.removeWhere((addr) => addr === address);
          successCount++;
          log(LOG_GROUP.AGENTS_SYNC, `Successfully synced agents for address: ${address}`);
        } else {
          log(LOG_GROUP.AGENTS_SYNC, `Failed to sync agents for address: ${address}`, result.reason);
        }
      }

      const remainingSize = await this.syncQueue.length();
      log(LOG_GROUP.AGENTS_SYNC, `Queue processing complete. Synced: ${successCount}, Remaining: ${remainingSize}`);

      // Clear queue and alarm if empty
      if (remainingSize === 0) {
        await this.clearAlarm();
        await this.syncQueue.clear();
        log(LOG_GROUP.AGENTS_SYNC, "Queue empty - cleared queue and alarm");
      }
    } catch (error) {
      log(LOG_GROUP.AGENTS_SYNC, "Error processing queue:", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Core sync logic for a specific address
  private async syncAgentsForAddress(address: string): Promise<void> {
    // Check if already syncing this address
    const isAlreadySyncing = await this.activeSyncs.includes(address);
    if (isAlreadySyncing) {
      log(LOG_GROUP.AGENTS_SYNC, `Skipping sync for ${address} - already in progress`);
      return;
    }

    // Mark address as being synced (automatically persisted)
    await this.activeSyncs.push(address);

    try {
      log(LOG_GROUP.AGENTS_SYNC, `Syncing agents for address: ${address}`);

      const currentAgents = await getAOYieldAgents(address);
      const existingAgentIds = new Set(currentAgents.map((agent) => agent.id));

      const edges = await gqlAll(AO_YIELD_AGENT_SYNC_QUERY, { address });
      const filteredEdges = edges.filter((edge) => !existingAgentIds.has(edge.node.id));

      if (filteredEdges.length === 0) {
        log(LOG_GROUP.AGENTS_SYNC, "No new agents found");
        return;
      }

      // Sort edges by timestamp in ascending order
      const sortedEdges = filteredEdges.sort((a, b) => {
        const aDate = new Date(a.node.block?.timestamp ? a.node.block.timestamp * 1000 : Date.now());
        const bDate = new Date(b.node.block?.timestamp ? b.node.block.timestamp * 1000 : Date.now());
        return aDate.getTime() - bDate.getTime();
      });

      const agentIds = sortedEdges.map((edge) => edge.node.id);
      const foundAgents = sortedEdges.map((edge) => {
        const agentVersion = getTagValue("Agent-Version", edge?.node?.tags) || "1.0.0";
        return { agentId: edge.node.id, agentVersion };
      });

      // Update feature flags
      await this.updateFeatureFlags(agentIds);

      const currentDate = Date.now();
      let successCount = 0;

      const agentInfoPromises = foundAgents.map(({ agentId, agentVersion }) =>
        this.limit(async () => {
          try {
            log(LOG_GROUP.AGENTS_SYNC, `Fetching agent info for ${agentId}`);
            let attempt = -1;
            const agentInfo = await queryClient.fetchQuery<AOYieldAgentInfo>({
              queryKey: ["ao-yield-agent-info", agentId],
              queryFn: async (): Promise<AOYieldAgentInfo> => {
                attempt++;
                return getAOYieldAgentInfo(agentId, agentVersion, attempt);
              },
              staleTime: 0, // Force fresh data
              gcTime: 0,
              retry: this.config.retryAttempts,
              retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
            });

            if (
              !agentInfo ||
              !agentInfo.startDate ||
              !agentInfo.endDate ||
              !agentInfo.status ||
              !agentInfo.conversionPercentage ||
              !agentInfo.tokenOut ||
              !agentInfo.slippage ||
              !agentInfo.version
            ) {
              log(LOG_GROUP.AGENTS_SYNC, `Agent info not found for ${agentId}`);
              return null;
            }

            log(LOG_GROUP.AGENTS_SYNC, `Agent info fetched for ${agentId}`);

            const agent: AOYieldAgent = {
              id: agentId,
              status: agentInfo.status,
              conversionPercentage: agentInfo.conversionPercentage,
              tokenOut: agentInfo.tokenOut,
              startDate: agentInfo.startDate,
              endDate: agentInfo.endDate,
              runIndefinitely: agentInfo.runIndefinitely,
              slippage: agentInfo.slippage,
              version: agentInfo.version,
              totalTransactions: agentInfo.totalTransactions ?? 0,
            };

            if (agent.status === "Active" && currentDate > agent.endDate) {
              const newStatus = agent.endDate === agentInfo.swappedUpToDate ? "Completed" : "Cancelled";
              agent.status = newStatus;
              updateAOYieldAgent(agentId, { status: newStatus }, true);
            }

            // Progressive update: Add agent immediately and write to storage
            const existingAgents = await getAOYieldAgents(address);
            const agentsMap = new Map<string, AOYieldAgent>();

            // Add existing agents
            existingAgents.forEach((a) => agentsMap.set(a.id, a));

            // Add/update new agent
            agentsMap.set(agent.id, agent);

            // Sort and save
            const updatedAgents = Array.from(agentsMap.values());
            updatedAgents.sort((a, b) => {
              const diff = a.startDate - b.startDate;
              if (diff !== 0) return diff;
              return Number(a.status === "Active") - Number(b.status === "Active");
            });
            await setAOYieldAgents(address, updatedAgents);
            successCount++;

            log(LOG_GROUP.AGENTS_SYNC, `Agent ${agentId} added (${successCount}/${agentIds.length})`);

            return agent;
          } catch (error) {
            log(LOG_GROUP.AGENTS_SYNC, `Error fetching agent info for ${agentId}:`, error);
            return null;
          }
        }),
      );

      await Promise.allSettled(agentInfoPromises);

      if (successCount === 0) {
        log(LOG_GROUP.AGENTS_SYNC, "No valid agents were fetched successfully");
        return;
      }

      log(LOG_GROUP.AGENTS_SYNC, `Successfully synced ${successCount} agents for address: ${address}`);
    } catch (error) {
      log(LOG_GROUP.AGENTS_SYNC, `Error syncing agents for address ${address}:`, error);
      throw error;
    } finally {
      // Always remove address from active syncs when done (automatically persisted)
      await this.activeSyncs.removeWhere((addr) => addr === address);
      log(LOG_GROUP.AGENTS_SYNC, `Sync completed for address: ${address}`);
    }
  }

  // Update feature flags based on agents
  private async updateFeatureFlags(agents: string[]): Promise<void> {
    try {
      if (agents.length > 0) {
        await ExtensionStorage.set(HAS_SHOWN_AGENTS_EXPLAINER_POPUP, true);
        await ExtensionStorage.set(SHOW_CREATE_WANDER_AGENT_CTA, false);
      }
    } catch (error) {
      log(LOG_GROUP.AGENTS_SYNC, "Error updating feature flags:", error);
    }
  }

  // Alarm management
  private async setupAlarm(): Promise<void> {
    try {
      const existingAlarm = await browser.alarms.get(this.config.alarmName);
      if (existingAlarm) return; // Alarm already exists

      // Create alarm that fires immediately to check queue
      browser.alarms.create(this.config.alarmName, { when: Date.now() });

      log(LOG_GROUP.AGENTS_SYNC, "Setup immediate alarm for queue processing");
    } catch (error) {
      log(LOG_GROUP.AGENTS_SYNC, "Error setting up alarm:", error);
    }
  }

  private async clearAlarm(): Promise<void> {
    try {
      await browser.alarms.clear(this.config.alarmName);
      log(LOG_GROUP.AGENTS_SYNC, "Cleared alarm");
    } catch (error) {
      log(LOG_GROUP.AGENTS_SYNC, "Error clearing alarm:", error);
    }
  }

  // Handle alarm trigger (should be called from background script)
  public async handleAlarm(alarmName: string): Promise<void> {
    if (alarmName !== this.config.alarmName) return;

    log(LOG_GROUP.AGENTS_SYNC, "Alarm triggered, processing queue");
    await this.initialize();
    await this.processQueueIfNeeded("alarm");
  }

  // Public utility methods
  public async getQueueSize(): Promise<number> {
    return await this.syncQueue.length();
  }

  public async getQueueAddresses(): Promise<string[]> {
    return await this.syncQueue.getAll();
  }

  public isProcessing(): boolean {
    return this.isProcessingQueue;
  }

  public async isAddressSyncing(address: string): Promise<boolean> {
    return await this.activeSyncs.includes(address);
  }

  public async getActiveSyncs(): Promise<string[]> {
    return await this.activeSyncs.getAll();
  }

  // Manual sync - immediate sync without setting up alarms
  public async manualAgentsSync(addresses: string[]): Promise<void> {
    if (IS_EMBEDDED_APP) return;

    await this.initialize();

    log(LOG_GROUP.AGENTS_SYNC, `Manual sync triggered for ${addresses.length} address(es): ${addresses.join(", ")}`);

    // Filter and validate addresses
    const validAddresses = addresses.filter((addr) => addr && addr.trim()).map((addr) => addr.trim());

    if (validAddresses.length === 0) {
      log(LOG_GROUP.AGENTS_SYNC, "No valid addresses to sync manually");
      return;
    }

    // Filter out addresses that are already being synced
    const activeSyncsList = await this.activeSyncs.getAll();
    const activeSyncsSet = new Set(activeSyncsList);
    const availableAddresses = validAddresses.filter((addr) => !activeSyncsSet.has(addr));
    const alreadySyncing = validAddresses.filter((addr) => activeSyncsSet.has(addr));

    if (alreadySyncing.length > 0) {
      log(
        LOG_GROUP.AGENTS_SYNC,
        `Skipping ${alreadySyncing.length} address(es) already syncing: ${alreadySyncing.join(", ")}`,
      );
    }

    if (availableAddresses.length === 0) {
      log(LOG_GROUP.AGENTS_SYNC, "All requested addresses are already syncing");
      return;
    }

    const results = await Promise.allSettled(availableAddresses.map((address) => this.syncAgentsForAddress(address)));

    // Log results
    let successCount = 0;
    results.forEach((result, index) => {
      const address = availableAddresses[index];
      if (result.status === "fulfilled") {
        successCount++;
        log(LOG_GROUP.AGENTS_SYNC, `Manual sync successful for address: ${address}`);
      } else {
        log(LOG_GROUP.AGENTS_SYNC, `Manual sync failed for address: ${address}`, result.reason);
      }
    });

    log(LOG_GROUP.AGENTS_SYNC, `Manual sync complete. Success: ${successCount}/${availableAddresses.length}`);
  }

  public async forceSync(): Promise<void> {
    const queueSize = await this.syncQueue.length();
    if (queueSize > 0) {
      await this.processQueueIfNeeded("manual");
    }
  }

  public async destroy(): Promise<void> {
    await this.syncQueue.clear();
    await this.activeSyncs.clear();
    this.isProcessingQueue = false;
  }
}

// Export singleton instance
export const agentSyncManager = AgentSyncManager.getInstance();
