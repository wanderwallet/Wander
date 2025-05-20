import React, { type PropsWithChildren } from "react";
import { DefaultCard } from "~components/embed/ui/molecules/card/default-card/DefaultCard";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

interface SelectorContainerProps extends PropsWithChildren {
  title: string;
  onClose: (e?: React.MouseEvent) => void;
}

export const SelectorContainer = ({ title, onClose, children }: SelectorContainerProps) => (
  <DefaultCard
    headerText={title}
    onBackButtonClick={onClose}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: "var(--color-card-background-default)",
      maxHeight: "100%",
      overflowY: "scroll",
  }}>
    {children}
  </DefaultCard>
);

export default SelectorContainer;
