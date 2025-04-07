import { Card } from "~components/embed/ui";
import React from "react";

interface SelectorContainerProps {
  title: string;
  onClose: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
}

export const SelectorContainer = ({
  title,
  onClose,
  children
}: SelectorContainerProps) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: "var(--color-card-background-default)"
    }}
  >
    <Card
      size="auto"
      headerText={title}
      hasBackButton={true}
      onBackButtonClick={onClose}
      style={{
        height: "100%",
        width: "100%",
        padding: "32px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {children}
    </Card>
  </div>
);

export default SelectorContainer;
