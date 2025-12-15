import styled from "styled-components";
import { Button, Section, Text, Loading } from "@wanderapp/components";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { useAOYieldAgents } from "~utils/agents/hooks";
import { AOYieldAgentListItem } from "../components/AOYieldAgentListItem";
import { useEffect, useMemo, useState } from "react";
import { trackPage, PageType } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { AO_YIELD_AGENT_SYNC_STATUS_PREFIX_KEY } from "~utils/agents/constants";
import type { AOYieldAgentSyncStatus } from "~utils/agents/types";
import { useActiveAddress } from "~wallets/hooks";

const PAGE_SIZE = 10;

export function AOYieldAgentHistoryView() {
  const { navigate, previousLocation } = useLocation();
  const aoAgents = useAOYieldAgents({ showNewAtTop: true });
  const [page, setPage] = useState(1);
  const activeAddress = useActiveAddress();
  const [syncStatus] = useStorage<AOYieldAgentSyncStatus | undefined>({
    key: AO_YIELD_AGENT_SYNC_STATUS_PREFIX_KEY + activeAddress,
    instance: ExtensionStorage,
  });

  const pagedAoAgents = useMemo(() => aoAgents.slice(0, page * PAGE_SIZE), [aoAgents, page]);

  const showSyncStatus = useMemo(
    () =>
      // Show sync status for 10 minutes after it started if its still not completed
      syncStatus?.status === "in_progress" && Date.now() - syncStatus.timestamp < 600000,
    [syncStatus],
  );

  useEffect(() => {
    trackPage(PageType.AO_YIELD_AGENT_HISTORY);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("agent_history")}
        back={() => {
          if (previousLocation === "/agents/ao-yield/create-agent") {
            navigate(previousLocation);
          } else {
            navigate("/agents");
          }
        }}
      />

      <Wrapper>
        <Flex gap={12} direction="column">
          {showSyncStatus && (
            <Flex align="center" justify="center" gap={4}>
              <Text weight="medium" noMargin>
                {browser.i18n.getMessage("agents_syncing")}
              </Text>
              <Loading style={{ width: 16, height: 16 }} />
            </Flex>
          )}

          {pagedAoAgents.map((aoAgent) => (
            <AOYieldAgentListItem key={aoAgent.id} aoAgent={aoAgent} isHistory />
          ))}
          {pagedAoAgents.length === 0 && (
            <Flex align="center" justify="center" style={{ height: "100%" }}>
              <Text size="lg" weight="medium" noMargin>
                {browser.i18n.getMessage("no_agents")}
              </Text>
            </Flex>
          )}
          {pagedAoAgents.length !== aoAgents.length && (
            <Flex align="center" justify="center">
              <Button onClick={() => setPage(page + 1)} fullWidth>
                {browser.i18n.getMessage("load_more")}
              </Button>
            </Flex>
          )}
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
`;
