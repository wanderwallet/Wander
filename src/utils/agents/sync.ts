import { gql, gqlAll } from "~gateways/api";
import { AO_YIELD_AGENT_SYNC_QUERY } from "./queries";
import { getAOYieldAgentInfo, getAOYieldAgents, setAOYieldAgents } from "./utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  AO_YIELD_AGENT_SYNC_ALARM_NAME_PREFIX,
  AO_YIELD_AGENT_SYNC_STATUS_PREFIX_KEY,
  HAS_SHOWN_AGENTS_EXPLAINER_POPUP,
  SHOW_CREATE_WANDER_AGENT_CTA,
} from "./constants";
import browser from "webextension-polyfill";
import type { AOYieldAgent } from "./types";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { pLimit } from "plimit-lit";
import { ExtensionStorage } from "~utils/storage";
import { queryClient } from "~utils/tanstack";

const limit = pLimit(10);

export async function checkAndSyncAgents(address: string): Promise<void> {
  try {
    await ExtensionStorage.set(AO_YIELD_AGENT_SYNC_STATUS_PREFIX_KEY + address, {
      status: "in_progress",
      timestamp: Date.now(),
    });

    if (!address) {
      log(LOG_GROUP.AGENTS, "No address provided");
      return;
    }

    log(LOG_GROUP.AGENTS, "Checking and syncing agents");

    let agents = await getAOYieldAgents(address);
    if (agents.length > 0) {
      log(LOG_GROUP.AGENTS, "Agents already present, no need to sync");
      return;
    }

    const edges = await gqlAll(AO_YIELD_AGENT_SYNC_QUERY, { address });

    if (edges.length === 0) {
      log(LOG_GROUP.AGENTS, "No agents found");
      return;
    }

    // sort edges by timestamp in ascending order
    const sortedEdges = edges.sort((a, b) => {
      const aDate = new Date(a.node.block?.timestamp ? a.node.block.timestamp * 1000 : Date.now());
      const bDate = new Date(b.node.block?.timestamp ? b.node.block.timestamp * 1000 : Date.now());
      return aDate.getTime() - bDate.getTime();
    });

    const agentIds = sortedEdges.map((edge) => edge.node.id);

    // Set extension storage values immediately since we know agents exist
    await ExtensionStorage.set(HAS_SHOWN_AGENTS_EXPLAINER_POPUP, true);
    await ExtensionStorage.set(SHOW_CREATE_WANDER_AGENT_CTA, false);

    // Read existing agents once and maintain ordered slots
    const currentAgents = await getAOYieldAgents(address);
    const agentSlots: (AOYieldAgent | null)[] = new Array(agentIds.length).fill(null);
    let successCount = 0;

    const agentInfoPromises = agentIds.map((agentId, index) =>
      limit(async () => {
        try {
          log(LOG_GROUP.AGENTS, `Fetching agent info for ${agentId}`);
          const agentInfo = await queryClient.fetchQuery({
            queryKey: ["ao-yield-agent-info", agentId],
            queryFn: () => getAOYieldAgentInfo(agentId),
            staleTime: 0, // Force fresh data
            gcTime: 0,
            retry: 1,
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
          });

          if (!agentInfo) {
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
            version: agentInfo.version,
          };

          // Store agent in correct position and update storage with ordered agents
          agentSlots[index] = agent;
          const orderedNewAgents = agentSlots.filter((agent): agent is AOYieldAgent => agent !== null);
          await setAOYieldAgents(address, [...currentAgents, ...orderedNewAgents]);
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

    if (successCount > 0) {
      log(LOG_GROUP.AGENTS, `Successfully synced ${successCount} agents progressively`);
    } else {
      log(LOG_GROUP.AGENTS, "No valid agents were fetched successfully");
    }
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error checking and syncing agents: ", error);
  } finally {
    await ExtensionStorage.remove(AO_YIELD_AGENT_SYNC_STATUS_PREFIX_KEY + address);
  }
}

export async function scheduleAgentsSync(address: string) {
  if (IS_EMBEDDED_APP) return;

  try {
    const alarmName = AO_YIELD_AGENT_SYNC_ALARM_NAME_PREFIX + address;
    const alarms = await browser.alarms.get(alarmName);
    if (alarms) return;

    browser.alarms.create(alarmName, { when: Date.now() });
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error scheduling agents sync: ", error);
  }
}
