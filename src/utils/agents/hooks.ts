import { useEffect, useState } from "react";
import { getAOYieldAgentInfo, getAOYieldAgents } from "./utils";
import type { AOYieldAgent, AOYieldAgentInfo, AOYieldAgentStatus } from "./types";
import { ExtensionStorage, useStorage } from "../storage";

export function useAOYieldAgents(status?: AOYieldAgentStatus) {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agents, setAgents] = useState<AOYieldAgent[]>([]);

  useEffect(() => {
    getAOYieldAgents(activeAddress, status).then(setAgents);
  }, [activeAddress, status]);

  return agents;
}

export function useAOYieldActiveAgent() {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agent, setAgent] = useState<AOYieldAgent>();

  useEffect(() => {
    getAOYieldAgents(activeAddress, "Active").then((agents) => setAgent(agents[agents.length - 1]));
  }, [activeAddress]);

  return agent;
}

export function useAOYieldAgent(agentId: string) {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agent, setAgent] = useState<AOYieldAgent>();

  useEffect(() => {
    getAOYieldAgents(activeAddress, "Active").then((agents) => {
      const agent = agents.find((agent) => agent.id === agentId);
      setAgent(agent);
    });
  }, [activeAddress, agentId]);

  return agent;
}

export function useAOYieldAgentInfo(agentId: string) {
  const [info, setInfo] = useState<AOYieldAgentInfo>();

  useEffect(() => {
    if (!agentId) return;
    getAOYieldAgentInfo(agentId).then(setInfo);
  }, [agentId]);

  return info;
}
