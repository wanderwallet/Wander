import { useAOMintingStatus, useAOYieldLatestAgent } from "~utils/agents/hooks";
import { AgentInfo } from "../components/ao-yield/agent-info";
import { AOMintingStatusModal } from "../components/AOMintingStatusModal";

export function ManageAOYieldAgentView() {
  const activeAgent = useAOYieldLatestAgent();
  const { data: mintingStatus, isError } = useAOMintingStatus();

  return (
    <>
      <AgentInfo headerTitle="manage_agent" agentId={activeAgent?.id || ""} mintingStatus={mintingStatus} />
      <AOMintingStatusModal mintingStatus={mintingStatus} isError={isError} />
    </>
  );
}
