import { Section } from "@arconnect/components-rebrand";
import { type CSSProperties, type Dispatch, type SetStateAction } from "react";
import styled from "styled-components";
import browser from "webextension-polyfill";

interface TabType {
  id: number;
  name: string;
  component: () => JSX.Element;
}

interface TabsProps {
  tabs: readonly TabType[];
  activeTab: number;
  setActiveTab: Dispatch<SetStateAction<number>>;
  containerStyle?: CSSProperties;
}

interface TabProps {
  tab: TabType;
  active: boolean;
  setActiveTab: Dispatch<SetStateAction<number>>;
}

const Tab = ({ tab, active, setActiveTab }: TabProps) => (
  <StyledTab
    active={active}
    tabId={tab.id}
    onClick={() => setActiveTab(tab.id)}
    data-active={active ? "true" : "false"}>
    {browser.i18n.getMessage(tab.name)}
  </StyledTab>
);

export default function Tabs({ tabs, activeTab, setActiveTab, containerStyle }: TabsProps) {
  const ActiveComponent = tabs[activeTab].component;

  return (
    <Section style={{ padding: 0, ...containerStyle }}>
      <TabsWrapper>
        {tabs.map((tab, index) => (
          <TabWrapper key={tab.id}>
            <Tab tab={tab} active={tab.id === activeTab} setActiveTab={setActiveTab} />
            {/* Seperator always visible, but transparent when current or next tab is active */}
            {index < tabs.length - 1 && (
              <Seperator transparent={tab.id === activeTab || tabs[index + 1].id === activeTab} />
            )}
          </TabWrapper>
        ))}
        <ActiveTabIndicator activeTabId={activeTab} tabs={tabs} />
      </TabsWrapper>
      <ContentWrapper>
        <ActiveComponent />
      </ContentWrapper>
    </Section>
  );
}

const TabWrapper = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Seperator = styled.div<{ transparent?: boolean }>`
  width: 1px;
  height: 23px;
  border-radius: 0.5px;
  background: ${(props) => (props.transparent ? "transparent" : "rgba(142, 142, 147, 0.2)")};
`;

const TabsWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  border-radius: 10px;
  padding: 2px;
  box-sizing: border-box;
  background: ${(props) => props.theme.surfaceSecondary};
  box-shadow: 0px 2px 3.3px 0px rgba(0, 0, 0, 0.07) inset;
  position: relative;
`;

const ActiveTabIndicator = ({ activeTabId, tabs }: { activeTabId: number; tabs: readonly TabType[] }) => {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);
  const tabWidth = 100 / tabs.length;

  const insetPercentage = 0.01;

  return (
    <SlideIndicator
      style={{
        left: `${tabWidth * activeIndex + tabWidth * insetPercentage}%`,
        width: `${tabWidth * (1 - 2 * insetPercentage)}%`,
      }}
    />
  );
};

const SlideIndicator = styled.div`
  position: absolute;
  height: 32px;
  border-radius: 8px;
  background: ${(props) =>
    props.theme.displayTheme === "dark" ? "linear-gradient(47deg, #5842f8 5.41%, #6b57f9 96%)" : "#FFF"};
  box-shadow:
    0px 3px 1px 0px rgba(0, 0, 0, 0.04),
    0px 3px 8px 0px rgba(0, 0, 0, 0.16);
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  transition:
    left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    width 0.3s ease;
  z-index: 1;
`;

const StyledTab = styled.button<{ active?: boolean; tabId: number }>`
  display: flex;
  flex: 1;
  height: 32px;
  padding: 3px 10px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: ${(props) => props.theme.secondaryText};
  box-sizing: border-box;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  position: relative;
  z-index: 2;
  background: transparent;
  border: none;

  &:hover:not([data-active="true"]) {
    background: ${(props) => (props.theme.displayTheme === "dark" ? "#403785" : "rgba(255, 255, 255, 0.8)")};
  }

  ${(props) =>
    props.active &&
    `
      color: ${props.theme.primaryText};
  `}
`;

const ContentWrapper = styled.div`
  margin-top: 24px;
  width: 100%;
`;
