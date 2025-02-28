import React from "react";
import styles from "./TabBar.module.css";
import { TabBarBaseProps } from "./TabBar.types";

import { Text } from "../../atoms";

const TabBar = React.forwardRef<HTMLDivElement, TabBarBaseProps>(
  ({ tabs, className, ...props }, ref) => {
    const Component = "div";

    const [activeTab, setActiveTab] = React.useState(0);

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
          style={{ left: activeTab === 1 ? `${49}%` : 0 }}
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
