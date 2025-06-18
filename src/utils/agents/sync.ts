import { gql } from "~gateways/api";
import { AO_YIELD_AGENT_SYNC_QUERY } from "./queries";
import { getAOYieldAgentInfo, getAOYieldAgents, setAOYieldAgents } from "./utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  AO_YIELD_AGENT_SYNC_ALARM_NAME_PREFIX,
  HAS_SHOWN_AGENTS_EXPLAINER_POPUP,
  SHOW_CREATE_WANDER_AGENT_CTA,
} from "./constants";
import browser from "webextension-polyfill";
import { QueryClient } from "@tanstack/react-query";
import type { AOYieldAgent } from "./types";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { pLimit } from "plimit-lit";
import { ExtensionStorage } from "~utils/storage";

const limit = pLimit(10);

const queryClient = new QueryClient();

let isSchedulingInProgress = false;
let isSyncInProgress = false;

export async function checkAndSyncAgents(address: string): Promise<void> {
  try {
    if (isSyncInProgress || !address) return;

    isSyncInProgress = true;

    log(LOG_GROUP.AGENTS, "Checking and syncing agents");

    let agents = await getAOYieldAgents(address);
    if (agents.length > 0) {
      log(LOG_GROUP.AGENTS, "Agents already present, no need to sync");
      return;
    }

    const response = await gql(AO_YIELD_AGENT_SYNC_QUERY, { address });
    const edges = response?.data?.transactions?.edges || [];

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

    const agentInfoPromises = agentIds.map((agentId) =>
      limit(async () => {
        try {
          const agentInfo = await queryClient.fetchQuery({
            queryKey: ["ao-yield-agent-info", agentId],
            queryFn: () => getAOYieldAgentInfo(agentId),
            staleTime: 0, // Force fresh data
            gcTime: 0,
            retry: 3,
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
          });

          return {
            id: agentId,
            status: agentInfo.status,
            conversionPercentage: agentInfo.conversionPercentage,
            tokenOut: agentInfo.tokenOut,
            startDate: agentInfo.startDate,
            endDate: agentInfo.endDate,
            runIndefinitely: agentInfo.runIndefinitely,
            slippage: agentInfo.slippage,
            version: agentInfo.version,
          } as AOYieldAgent;
        } catch (error) {
          log(LOG_GROUP.AGENTS, `Error fetching agent info for ${agentId}:`, error);
          return null;
        }
      }),
    );

    const agentResults = await Promise.allSettled(agentInfoPromises);

    const validAgents: AOYieldAgent[] = agentResults
      .filter(
        (result): result is PromiseFulfilledResult<AOYieldAgent | null> =>
          result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value!);

    if (validAgents.length > 0) {
      const existingAgents = await getAOYieldAgents(address);
      await setAOYieldAgents(address, [...existingAgents, ...validAgents]);
      await ExtensionStorage.set(HAS_SHOWN_AGENTS_EXPLAINER_POPUP, true);
      await ExtensionStorage.set(SHOW_CREATE_WANDER_AGENT_CTA, false);
      log(LOG_GROUP.AGENTS, `Successfully synced ${validAgents.length} agents`);
    }
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error checking recent txs:", error);
  } finally {
    isSyncInProgress = false;
  }
}

export async function scheduleAgentsSync(address: string) {
  if (IS_EMBEDDED_APP || isSchedulingInProgress) return;

  isSchedulingInProgress = true;

  try {
    const alarmName = AO_YIELD_AGENT_SYNC_ALARM_NAME_PREFIX + address;
    const alarms = await browser.alarms.get(alarmName);
    if (alarms) return;

    browser.alarms.create(alarmName, { when: Date.now() });
  } finally {
    isSchedulingInProgress = false;
  }
}
