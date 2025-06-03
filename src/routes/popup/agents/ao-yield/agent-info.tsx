import { AgentInfo } from "../components/ao-yield/agent-info";
import type { CommonRouteProps } from "~wallets/router/router.types";

export interface AOYieldAgentInfoParams {
  id: string;
}

export type AOYieldAgentInfoViewProps = CommonRouteProps<AOYieldAgentInfoParams>;

export function AOYieldAgentInfoView({ params: { id } }: AOYieldAgentInfoViewProps) {
  return <AgentInfo agentId={id} isHistory />;
}
