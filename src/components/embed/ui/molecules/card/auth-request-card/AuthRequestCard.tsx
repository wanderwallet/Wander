import { Card,  } from "~components/embed/ui/molecules/card/Card";
import type { CardBaseProps } from "~components/embed/ui/molecules/card/Card.types";
import { XClose } from "@untitled-ui/icons-react";
import { Button } from "~components/embed/ui/atoms";
import browser from "~iframe/browser";

import styles from "./AuthRequestCard.module.scss";

export interface AuthRequestCardProps extends Omit<CardBaseProps, "size" | "hasBackButton" | "customIcon" | "hasCloseButton" | "closeButtonStyles"> {
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  isConfirmDisabled?: boolean;
}

export function AuthRequestCard({
  onBackButtonClick,
  onCancel,
  onConfirm,
  cancelLabel = browser.i18n.getMessage("cancel"),
  confirmLabel = browser.i18n.getMessage("continue"),
  isConfirmDisabled,
  children: childrenProp,
  ...cardProps
}: AuthRequestCardProps) {
  const children = (
    <div className={ styles.childrenWrapper }>
      {childrenProp}
    </div>
  );

  const footerElement = (onCancel || onConfirm) ? (
    <div style={{
      display: "flex",
      padding: "var(--spacing-3)",
      gap: "var(--spacing-3)",
      marginTop: "auto",
      width: "100%",
    }}>
      { onCancel ? (
        <Button
          variant="secondary"
          isFullWidth
          onClick={onCancel}>
          { cancelLabel }
        </Button>
      ) : null }

      { onConfirm ? (
        <Button
          variant="primary"
          isFullWidth
          onClick={onConfirm}
          isDisabled={ isConfirmDisabled }>
          { confirmLabel }
        </Button>
      ) : null }
    </div>
  ) : null;

  return (
    <Card
      {...cardProps}
      size="auto"
      hasBackButton={ !!onBackButtonClick }
      onBackButtonClick={onBackButtonClick}
      customIcon={<XClose fontSize={24} color={"#666666"} />}
      footerElement={ footerElement }
      children={ children } />
  )
}
