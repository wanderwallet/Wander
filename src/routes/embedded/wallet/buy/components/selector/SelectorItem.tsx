import { Button, Text, Row, Box } from "~components/embed/ui";
import React from "react";

import styles from "../../buy.module.scss";

interface SelectorItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const SelectorItem = ({ icon, title, subtitle, isSelected, onClick }: SelectorItemProps) => (
  <li>
    <button
      className={ styles.buttonDropdown }
      onClick={onClick}>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          fontSize: "24px",
        }}>
        {icon}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          overflow: "hidden",
          flex: "1 1 auto",
        }}>
        <Text
          variant="bodyMd"
          style={{
            fontWeight: "500",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}>
          {title}
        </Text>
        <Text
          variant="bodySm"
          style={{
            color: "#666666",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}>
          {subtitle}
        </Text>
      </div>

      {isSelected && (
        <Text
          variant="bodyMd"
          style={{
            color: "var(--color-accent)",
            flex: "0 0 auto",
          }}>
          ✓
        </Text>
      )}

    </button>
  </li>
);

export default SelectorItem;
