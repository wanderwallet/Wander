import type React from "react";
import { Card } from "~components/embed/ui/molecules/card/Card";
import type { CardBaseProps } from "~components/embed/ui/molecules/card/Card.types";
import { WanderFooter } from "~components/embed/ui/templates/wander-footer/WanderFooter";

import styles from "./DefaultCard.module.scss";

export interface DefaultCardProps
  extends Omit<CardBaseProps, "footerElement" | "size" | "customIcon" | "onCloseButtonClick" | "closeButtonStyles"> {
  hasFooter?: boolean;
}

export function DefaultCard({ children: childrenProp, hasFooter = false, ...cardProps }: DefaultCardProps) {
  const children = <div className={styles.childrenWrapper}>{childrenProp}</div>;

  return <Card {...cardProps} footerElement={hasFooter ? <WanderFooter /> : null} size="auto" children={children} />;
}
