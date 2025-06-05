import { useAOYieldActiveAgent } from "~utils/agents/hooks";
import { AgentInfo } from "../components/ao-yield/agent-info";
import { AOMintingStatusModal } from "../components/AOMintingStatusModal";

export function ManageAOYieldAgentView() {
  const activeAgent = useAOYieldActiveAgent();

  return (
    <>
      <AgentInfo headerTitle="manage_agent" agentId={activeAgent?.id || ""} showEdit showCancel />
      <AOMintingStatusModal />
    </>
  );
}
