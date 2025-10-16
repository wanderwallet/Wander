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
import { sleep } from "~utils/promises/sleep";

interface AgentSyncConfig {
  retryAttempts: number;
  retryDelayMs: number;
  alarmName: string;
}

interface PersistedSyncQueue {
  addresses: string[];
  lastUpdated: number;
}

type SyncTrigger = "alarm" | "manual";

const STORAGE_KEYS = {
  SYNC_QUEUE: "ao_yield_agent_sync_queue",
  SYNC_PROCESSING: "ao_yield_agent_sync_processing",
};

class AgentSyncManager {
  private static instance: AgentSyncManager | null = null;
  private syncQueue: Set<string> = new Set();
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

    log(LOG_GROUP.AGENTS, "Initializing AgentSyncManager...");

    // Check if alarm exists - if not, no sync is scheduled/running, safe to clear flag
    const existingAlarm = await browser.alarms.get(this.config.alarmName);
    if (!existingAlarm && !this.isProcessingQueue) {
      await ExtensionStorage.set(STORAGE_KEYS.SYNC_PROCESSING, false);
      log(LOG_GROUP.AGENTS, "No alarm found and no sync is in progress, clearing processing flag");
    }

    // Load persisted data
    await this.loadQueue();

    // Log restored addresses if any
    if (this.syncQueue.size > 0) {
      log(LOG_GROUP.AGENTS, `Restored ${this.syncQueue.size} addresses from persistent queue`);
    }

    this.isInitialized = true;
    log(LOG_GROUP.AGENTS, "Initialization complete");
  }

  // Entry point for scheduling agent sync (called when adding/importing wallets)
  public async scheduleAgentsSync(addresses: string[]): Promise<void> {
    if (IS_EMBEDDED_APP) return;

    await this.initialize(); // Ensure initialized

    log(LOG_GROUP.AGENTS, `Scheduling sync for ${addresses.length} addresses:`, addresses);

    // Add addresses to sync queue
    const initialSize = this.syncQueue.size;
    addresses.forEach((address) => {
      if (address && address.trim()) {
        this.syncQueue.add(address.trim());
      }
    });

    const newAddresses = this.syncQueue.size - initialSize;
    log(LOG_GROUP.AGENTS, `Added ${newAddresses} new addresses. Queue size: ${this.syncQueue.size}`);

    // Persist the updated queue
    await this.saveQueue();

    // Setup instant one-time alarm (fires immediately, works even if extension closes)
    if (this.syncQueue.size > 0) {
      await this.setupAlarm();
    }
  }

  // Process the sync queue
  private async processQueueIfNeeded(trigger: SyncTrigger): Promise<void> {
    // Check storage-based processing flag (works across contexts)
    const isProcessingInStorage = await ExtensionStorage.get<boolean>(STORAGE_KEYS.SYNC_PROCESSING);

    if (isProcessingInStorage || this.isProcessingQueue) {
      log(
        LOG_GROUP.AGENTS,
        `Skipping ${trigger} sync - another sync is already in progress (storage: ${isProcessingInStorage}, local: ${this.isProcessingQueue})`,
      );
      return;
    }

    if (this.syncQueue.size === 0) {
      log(LOG_GROUP.AGENTS, `Skipping ${trigger} sync - queue is empty`);
      return;
    }

    // Set both flags (storage for cross-context, local for same-context)
    this.isProcessingQueue = true;
    await ExtensionStorage.set(STORAGE_KEYS.SYNC_PROCESSING, true);

    try {
      log(LOG_GROUP.AGENTS, `Processing queue (${this.syncQueue.size} addresses) - trigger: ${trigger}`);

      const addressesToProcess = Array.from(this.syncQueue);
      const results = await Promise.allSettled(addressesToProcess.map((address) => this.syncAgentsForAddress(address)));

      // Process results and remove successful syncs from queue
      let successCount = 0;
      results.forEach((result, index) => {
        const address = addressesToProcess[index];
        if (result.status === "fulfilled") {
          this.syncQueue.delete(address);
          successCount++;
          log(LOG_GROUP.AGENTS, `Successfully synced agents for address: ${address}`);
        } else {
          log(LOG_GROUP.AGENTS, `Failed to sync agents for address: ${address}`, result.reason);
        }
      });

      // Persist the updated queue after processing
      await this.saveQueue();

      log(LOG_GROUP.AGENTS, `Queue processing complete. Synced: ${successCount}, Remaining: ${this.syncQueue.size}`);

      // Clear queue and alarm if empty
      if (this.syncQueue.size === 0) {
        await this.clearAlarm();
        await this.clearQueue();
        log(LOG_GROUP.AGENTS, "Queue empty - cleared queue and alarm");
      }
    } catch (error) {
      log(LOG_GROUP.AGENTS, "Error processing queue:", error);
    } finally {
      this.isProcessingQueue = false;
      await ExtensionStorage.set(STORAGE_KEYS.SYNC_PROCESSING, false);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const persistedQueue = await ExtensionStorage.get<PersistedSyncQueue>(STORAGE_KEYS.SYNC_QUEUE);

      if (persistedQueue?.addresses?.length) {
        this.syncQueue = new Set(persistedQueue.addresses);
        log(LOG_GROUP.AGENTS, `Loaded ${this.syncQueue.size} addresses from persistent storage`);
        log(LOG_GROUP.AGENTS, `Queue last updated: ${new Date(persistedQueue.lastUpdated).toISOString()}`);
      }
    } catch (error) {
      log(LOG_GROUP.AGENTS, "Error loading queue from storage:", error);
      this.syncQueue = new Set();
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const queueData: PersistedSyncQueue = {
        addresses: Array.from(this.syncQueue),
        lastUpdated: Date.now(),
      };

      await ExtensionStorage.set(STORAGE_KEYS.SYNC_QUEUE, queueData);
      log(LOG_GROUP.AGENTS, `Persisted queue with ${this.syncQueue.size} addresses`);
    } catch (error) {
      log(LOG_GROUP.AGENTS, "Error saving queue to storage:", error);
    }
  }

  private async clearQueue(): Promise<void> {
    try {
      await ExtensionStorage.remove(STORAGE_KEYS.SYNC_QUEUE);
      log(LOG_GROUP.AGENTS, "Cleared persistent queue");
    } catch (error) {
      log(LOG_GROUP.AGENTS, "Error clearing queue from storage:", error);
    }
  }

  // Core sync logic for a specific address
  private async syncAgentsForAddress(address: string): Promise<void> {
    try {
      log(LOG_GROUP.AGENTS, `Syncing agents for address: ${address}`);

      let existingAgents = await getAOYieldAgents(address);
      const existingAgentIds = new Set(existingAgents.map((agent) => agent.id));

      const edges = await gqlAll(AO_YIELD_AGENT_SYNC_QUERY, { address });
      const filteredEdges = edges.filter((edge) => !existingAgentIds.has(edge.node.id));

      if (filteredEdges.length === 0) {
        log(LOG_GROUP.AGENTS, "No new agents found");
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

      // Read existing agents once and maintain ordered slots
      const currentAgents = await getAOYieldAgents(address);
      const agentSlots: (AOYieldAgent | null)[] = new Array(agentIds.length).fill(null);
      let successCount = 0;

      const currentDate = Date.now();

      const agentInfoPromises = foundAgents.map(({ agentId, agentVersion }, index) =>
        this.limit(async () => {
          try {
            log(LOG_GROUP.AGENTS, `Fetching agent info for ${agentId}`);
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
              !agentInfo.agentVersion
            ) {
              log(LOG_GROUP.AGENTS, `Agent info not found for ${agentId}`);
              return null;
            }

            log(LOG_GROUP.AGENTS, `Agent info fetched for ${agentId}`);

            const agent: AOYieldAgent = {
              id: agentId,
              status: agentInfo.status,
              conversionPercentage: agentInfo.conversionPercentage,
              tokenOut: agentInfo.tokenOut,
              startDate: agentInfo.startDate,
              endDate: agentInfo.endDate,
              runIndefinitely: agentInfo.runIndefinitely,
              slippage: agentInfo.slippage,
              version: agentInfo.agentVersion,
              totalTransactions: agentInfo.totalTransactions ?? 0,
            };

            if (agent.status === "Active" && currentDate > agent.endDate) {
              const newStatus = agent.endDate === agentInfo.swappedUpToDate ? "Completed" : "Cancelled";
              agent.status = newStatus;
              updateAOYieldAgent(agentId, { status: newStatus }, true);
            }

            // Store agent in correct position and update storage with ordered agents
            agentSlots[index] = agent;
            const orderedNewAgents = agentSlots.filter((agent): agent is AOYieldAgent => agent !== null);
            const updatedAgents = [...currentAgents, ...orderedNewAgents];
            updatedAgents.sort((a, b) => {
              const diff = a.startDate - b.startDate;
              if (diff !== 0) return diff;
              return Number(a.status === "Active") - Number(b.status === "Active");
            });
            await setAOYieldAgents(address, updatedAgents);
            successCount++;
            log(LOG_GROUP.AGENTS, `Agent ${agentId} added at position ${index} (${successCount}/${agentIds.length})`);

            return agent;
          } catch (error) {
            log(LOG_GROUP.AGENTS, `Error fetching agent info for ${agentId}:`, error);
            return null;
          }
        }),
      );

      await Promise.allSettled(agentInfoPromises);

      // Remove duplicates based on agent ID
      const updatedAgents = await getAOYieldAgents(address);
      const uniqueAgentsMap = new Map<string, AOYieldAgent>();
      updatedAgents.forEach((agent) => uniqueAgentsMap.set(agent.id, agent));
      const uniqueAgents = Array.from(uniqueAgentsMap.values());

      // Update storage only if duplicates were found
      if (uniqueAgents.length !== updatedAgents.length) {
        await setAOYieldAgents(address, uniqueAgents);
        log(LOG_GROUP.AGENTS, `Removed ${updatedAgents.length - uniqueAgents.length} duplicate agents`);
      }

      if (successCount > 0) {
        log(LOG_GROUP.AGENTS, `Successfully synced ${successCount} agents progressively`);
      } else {
        log(LOG_GROUP.AGENTS, "No valid agents were fetched successfully");
      }
    } catch (error) {
      log(LOG_GROUP.AGENTS, `Error syncing agents for address ${address}:`, error);
      throw error;
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
      log(LOG_GROUP.AGENTS, "Error updating feature flags:", error);
    }
  }

  // Alarm management
  private async setupAlarm(): Promise<void> {
    try {
      const existingAlarm = await browser.alarms.get(this.config.alarmName);
      if (existingAlarm) return; // Alarm already exists

      // Create alarm that fires immediately to check queue
      browser.alarms.create(this.config.alarmName, { when: Date.now() });

      log(LOG_GROUP.AGENTS, "Setup immediate alarm for queue processing");
    } catch (error) {
      log(LOG_GROUP.AGENTS, "Error setting up alarm:", error);
    }
  }

  private async clearAlarm(): Promise<void> {
    try {
      await browser.alarms.clear(this.config.alarmName);
      log(LOG_GROUP.AGENTS, "Cleared alarm");
    } catch (error) {
      log(LOG_GROUP.AGENTS, "Error clearing alarm:", error);
    }
  }

  // Handle alarm trigger (should be called from background script)
  public async handleAlarm(alarmName: string): Promise<void> {
    if (alarmName !== this.config.alarmName) return;

    log(LOG_GROUP.AGENTS, "Alarm triggered, processing queue");
    await this.initialize();
    await sleep(100);
    await this.processQueueIfNeeded("alarm");
  }

  // Public utility methods
  public getQueueSize(): number {
    return this.syncQueue.size;
  }

  public getQueueAddresses(): string[] {
    return Array.from(this.syncQueue);
  }

  public isProcessing(): boolean {
    return this.isProcessingQueue;
  }

  // Manual sync - immediate sync without setting up alarms
  public async manualAgentsSync(addresses: string[]): Promise<void> {
    if (IS_EMBEDDED_APP) return;

    await this.initialize(); // Ensure initialized

    log(LOG_GROUP.AGENTS, `Manual sync triggered for addresses: ${addresses.join(", ")}`);

    // Add address to sync queue
    addresses.forEach((address) => {
      if (address && address.trim()) {
        this.syncQueue.add(address.trim());
      }
    });

    // Persist the updated queue
    await this.saveQueue();

    // Process immediately with manual trigger (no alarm setup)
    await this.processQueueIfNeeded("manual");
  }

  public async forceSync(): Promise<void> {
    if (this.syncQueue.size > 0) {
      await this.processQueueIfNeeded("manual");
    }
  }

  public destroy(): void {
    this.syncQueue.clear();
    this.isProcessingQueue = false;
  }
}

// Export singleton instance
export const agentSyncManager = AgentSyncManager.getInstance();
