import React from "react";
import styles from "./TabBar.module.css";
import type { TabBarBaseProps } from "./TabBar.types";

import { Text } from "../../atoms";

const TabBar = React.forwardRef<HTMLDivElement, TabBarBaseProps>(
  ({ tabs, className, setActiveTab, activeTab, ...props }, ref) => {
    const Component = "div";

    return (
      <Component
        ref={ref}
        className={`
        ${styles["tabs"]}
        ${className}`}
        {...props}
      >
        <div
          className={`${styles["active"]}`}
          style={{ left: activeTab === 1 ? `${47}%` : 0 }}
        ></div>
        {tabs.map((tab, index) => (
          <button
            key={index}
            data-tab={tab.label}
            onClick={() => setActiveTab(index)}
          >
            <Text
              variant="bodySm"
              style={{ color: "#121212", fontWeight: "bold" }}
            >
              {tab.label}
            </Text>
          </button>
        ))}
      </Component>
    );
  }
);

TabBar.displayName = "TabBar";

export { TabBar };
