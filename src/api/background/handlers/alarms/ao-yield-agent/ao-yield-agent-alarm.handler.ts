import type { Alarms } from "webextension-polyfill";
import { AO_YIELD_AGENT_ALARM_NAME } from "~utils/agents/constants";
import { executeAutomaticSwapIfNeeded } from "~utils/agents/mint";

/**
 * Alarm handler for executing automatic token swaps via AO yield agent.
 * Checks if any pending swaps need to be executed based on configured thresholds
 * and executes them if conditions are met.
 */

export async function handleAOYieldAgentAlarm(alarmInfo?: Alarms.Alarm) {
  if (alarmInfo && alarmInfo.name !== AO_YIELD_AGENT_ALARM_NAME) return;

  await executeAutomaticSwapIfNeeded();
}
