import React from "react";
import type { TabBarBaseProps } from "./TabBar.types";
import { Text } from "../../atoms";

import styles from "./TabBar.module.scss";

const TabBar = React.forwardRef<HTMLDivElement, TabBarBaseProps>(
  ({ tabs, className, setActiveTab, activeTab, ...props }, ref) => {
    const Component = "div";
    const tabIndex = activeTab;
    const tabWidth = `${ 100 / tabs.length }%`;
    const currentTabIndicatorStyle = {
      ["--tabIndex"]: tabIndex,
      ["--tabWidth"]: tabWidth,
    } as React.CSSProperties;

    return (
      <Component
        ref={ref}
        className={`
        ${styles["tabs"]}
        ${className}`}
        {...props}>
        <div className={`${styles["active"]}`} style={currentTabIndicatorStyle}></div>
        {tabs.map((tab, index) => (
          <button key={index} data-tab={tab.label} onClick={() => setActiveTab(index)}>
            <Text variant="bodySm" style={{ color: "#121212", fontWeight: "bold" }}>
              {tab.label}
            </Text>
          </button>
        ))}
      </Component>
    );
  },
);

TabBar.displayName = "TabBar";

export { TabBar };
