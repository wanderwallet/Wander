import { useAOYieldActiveAgent } from "~utils/agents/hooks";
import { AgentInfo } from "../components/ao-yield/agent-info";

export function ManageAOYieldAgentView() {
  const activeAgent = useAOYieldActiveAgent();

  return <AgentInfo agentId={activeAgent?.id || ""} showEdit showCancel />;
}
