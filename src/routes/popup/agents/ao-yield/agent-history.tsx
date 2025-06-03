import styled from "styled-components";
import { Section } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { useAOYieldAgents } from "~utils/agents/hooks";
import { AOYieldAgentListItem } from "../components/AOYieldAgentListItem";

export function AOYieldAgentHistoryView() {
  const aoAgents = useAOYieldAgents();

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("agent_history")} />

      <Wrapper>
        <Flex gap={12} direction="column">
          {aoAgents.map((aoAgent) => (
            <AOYieldAgentListItem key={aoAgent.id} aoAgent={aoAgent} isHistory />
          ))}
        </Flex>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  padding-bottom: 100px;
`;
