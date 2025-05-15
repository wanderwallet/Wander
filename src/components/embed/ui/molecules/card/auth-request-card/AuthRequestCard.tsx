import { Card,  } from "~components/embed/ui/molecules/card/Card";
import type { CardBaseProps } from "~components/embed/ui/molecules/card/Card.types";
import { XClose } from "@untitled-ui/icons-react";

import styles from "./AuthRequestCard.module.scss";

export interface AuthRequestCardProps extends Omit<CardBaseProps, "footerElement" | "size" | "hasBackButton" | "customIcon" | "hasCloseButton" | "closeButtonStyles"> {
}

export function AuthRequestCard({
  onBackButtonClick,
  children: childrenProp,
  ...cardProps
}: AuthRequestCardProps) {
  const children = (
    <div className={ styles.childrenWrapper }>
      {childrenProp}
    </div>
  );

  return (
    <Card
      {...cardProps}
      size="auto"
      hasBackButton={ !!onBackButtonClick }
      onBackButtonClick={onBackButtonClick}
      customIcon={<XClose fontSize={24} color={"#666666"} />}
      children={ children } />
  )
}
