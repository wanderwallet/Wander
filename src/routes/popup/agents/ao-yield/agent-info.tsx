import { PageType, trackPage } from "~utils/analytics";
import { AgentInfo } from "../components/ao-yield/agent-info";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useEffect } from "react";

export interface AOYieldAgentInfoParams {
  id: string;
}

export type AOYieldAgentInfoViewProps = CommonRouteProps<AOYieldAgentInfoParams>;

export function AOYieldAgentInfoView({ params: { id } }: AOYieldAgentInfoViewProps) {
  useEffect(() => {
    trackPage(PageType.AO_YIELD_AGENT_HISTORY_DETAILS);
  }, []);

  return <AgentInfo headerTitle="agent_history" agentId={id} isHistory />;
}
