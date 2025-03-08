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
  >
    {browser.i18n.getMessage(tab.name)}
  </StyledTab>
);

export default function Tabs({
  tabs,
  activeTab,
  setActiveTab,
  containerStyle
}: TabsProps) {
  const ActiveComponent = tabs[activeTab].component;

  return (
    <Section style={{ padding: 0, ...containerStyle }}>
      <TabsWrapper>
        {tabs.map((tab, index) => (
          <TabWrapper key={tab.id}>
            <Tab
              tab={tab}
              active={tab.id === activeTab}
              setActiveTab={setActiveTab}
            />
            {/* Show separator between tabs except when current or next tab is active */}
            {index < tabs.length - 1 &&
              tab.id !== activeTab &&
              tabs[index + 1].id !== activeTab && <Seperator />}
          </TabWrapper>
        ))}
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

const Seperator = styled.div`
  width: 1px;
  height: 23px;
  border-radius: 0.5px;
  background: rgba(142, 142, 147, 0.2);
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

  ${(props) =>
    props.active &&
    `
      color: ${props.theme.primaryText};
      border: 0.5px solid rgba(0, 0, 0, 0.12);
      background: ${props.theme.displayTheme === "dark" ? "#403785" : "#FFF"};
      box-shadow: 0px 3px 1px 0px rgba(0, 0, 0, 0.04), 0px 3px 8px 0px rgba(0, 0, 0, 0.16);
  `}
`;

const ContentWrapper = styled.div`
  margin-top: 24px;
  width: 100%;
`;
