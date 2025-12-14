import { Flex } from "~components/common/Flex";
import { Text } from "@wanderapp/components";
import browser from "webextension-polyfill";
import { AO_PROCESS_ID, AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { useAOYieldLatestAgent } from "~utils/agents/hooks";
import { AOYieldAgentListItem } from "~routes/popup/agents/components/AOYieldAgentListItem";
import { useActiveTokens, type ActiveAgentToken } from "~routes/popup/agents/liquidops/utils/hooks/useAvailableTokens";
import { useMemo } from "react";
import { Agent } from "~routes/popup/agents/components/liquidops/Agent";
import { Carousel } from "~components/Carousel";
import type { AOYieldAgent } from "~utils/agents/types";
import { useTheme } from "styled-components";
import { ArrowNarrowLeft, ArrowNarrowRight } from "@untitled-ui/icons-react";

interface ActiveAgentsSliderProps {
  id: string;
}

interface AgentSlide {
  type: "ao-agent" | "lo-agent";
  agent: AOYieldAgent | ActiveAgentToken;
}

const renderSlide = (slide: AgentSlide) => {
  if (slide.type === "ao-agent") {
    const agent = slide.agent as AOYieldAgent;
    return <AOYieldAgentListItem aoAgent={agent} />;
  } else {
    const agent = slide.agent as ActiveAgentToken;
    return <Agent key={agent.ticker} ticker={agent.cleanTicker} profit={agent.profit} running />;
  }
};

export function ActiveAgentsSlider({ id }: ActiveAgentsSliderProps) {
  const theme = useTheme();
  const aoAgent = useAOYieldLatestAgent();
  const { data: activeTokens } = useActiveTokens();
  const activeLOAgent = useMemo(() => activeTokens?.find((agent) => agent.address === id), [activeTokens, id]);
  const activeAOAgent = useMemo(
    () => (aoAgent?.tokenOut === id || id === AO_PROCESS_ID) && aoAgent?.status === "Active" && aoAgent,
    [aoAgent, id],
  );

  const carouselData = useMemo(() => {
    return [
      activeAOAgent && { type: "ao-agent", agent: activeAOAgent as AOYieldAgent },
      activeLOAgent && { type: "lo-agent", agent: activeLOAgent as ActiveAgentToken },
    ].filter(Boolean);
  }, [activeAOAgent, activeLOAgent]);

  if (id === AR_PROCESS_ID || carouselData.length === 0) return null;

  return (
    <Flex direction="column" gap={8}>
      <Text variant="secondary" weight="medium" noMargin>
        {browser.i18n.getMessage("active_agents")}
      </Text>

      <Carousel
        slides={carouselData}
        renderSlide={(slide) => renderSlide(slide as AgentSlide)}
        showDots={true}
        showNavigationArrows={true}
        options={{ loop: false }}
        slideNavigationGap={8}
        navigationArrowSize={16}
        navigationLeftArrowIcon={ArrowNarrowLeft}
        navigationRightArrowIcon={ArrowNarrowRight}
        dotColor="rgba(102, 102, 102, 0.50)"
        activeDotColor={theme.primary}
        navigationArrowColor={theme.tertiaryText}
        showSlideEdges={true}
      />
    </Flex>
  );
}
