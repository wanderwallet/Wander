import { useAOMintingStatus, useAOYieldLatestAgent } from "~utils/agents/hooks";
import { AgentInfo } from "../components/ao-yield/agent-info";
import { AOMintingStatusModal } from "../components/AOMintingStatusModal";
import { useEffect } from "react";
import { trackPage, PageType } from "~utils/analytics";

export function ManageAOYieldAgentView() {
  const activeAgent = useAOYieldLatestAgent();
  const { data: mintingStatus, isError } = useAOMintingStatus();

  useEffect(() => {
    trackPage(PageType.AO_YIELD_AGENT_MANAGE);
  }, []);

  return (
    <>
      <AgentInfo headerTitle="manage_agent" agentId={activeAgent?.id || ""} mintingStatus={mintingStatus} />
      <AOMintingStatusModal mintingStatus={mintingStatus} isError={isError} />
    </>
  );
}
