import type React from "react";
import { Card } from "~components/embed/ui/molecules/card/Card";
import type { CardBaseProps } from "~components/embed/ui/molecules/card/Card.types";
import { WanderFooter } from "~components/embed/ui/templates/wander-footer/WanderFooter";

import styles from "./OnboardingCard.module.scss";

export interface OnboardingCardProps
  extends Omit<CardBaseProps, "footerElement" | "size" | "onCloseButtonClick" | "closeButtonStyles"> {
  onSubmit?: React.FormEventHandler;
}

export function OnboardingCard({ onSubmit, children: childrenProp, ...cardProps }: OnboardingCardProps) {
  const children = onSubmit ? (
    <form onSubmit={onSubmit} noValidate className={styles.childrenWrapper}>
      {childrenProp}
    </form>
  ) : (
    <div className={styles.childrenWrapper}>{childrenProp}</div>
  );

  return <Card {...cardProps} footerElement={<WanderFooter />} size="auto" children={children} />;
}
