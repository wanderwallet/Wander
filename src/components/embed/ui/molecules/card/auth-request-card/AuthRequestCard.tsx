import { Card } from "~components/embed/ui/molecules/card/Card";
import type { CardBaseProps } from "~components/embed/ui/molecules/card/Card.types";
import { XClose } from "@untitled-ui/icons-react";
import { Button } from "~components/embed/ui/atoms";
import browser from "~iframe/browser";
import { useEffect } from "react";

import styles from "./AuthRequestCard.module.scss";

export interface AuthRequestCardProps
  extends Omit<CardBaseProps, "size" | "hasBackButton" | "customIcon" | "hasCloseButton" | "closeButtonStyles"> {
  onCancel?: () => void;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
}

export function AuthRequestCard({
  onCancel,
  cancelLabel = browser.i18n.getMessage("cancel"),
  onConfirm,
  confirmLabel = browser.i18n.getMessage("confirm"),
  children: childrenProp,
  isDisabled,
  onBackButtonClick,
  ...cardProps
}: AuthRequestCardProps) {
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (isDisabled) return;

      if (onConfirm && (e.key === "Enter" || e.key.toUpperCase() === "Y")) {
        onConfirm();
      } else if (onCancel && (e.key === "Delete" || e.key.toUpperCase() === "N")) {
        onCancel();
      }
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [isDisabled]);

  const children = <div className={styles.childrenWrapper}>{childrenProp}</div>;

  const footerElement =
    onCancel || onConfirm ? (
      <div
        style={{
          display: "flex",
          padding: "var(--spacing-3)",
          gap: "var(--spacing-3)",
          marginTop: "auto",
          width: "100%",
        }}>
        {onCancel ? (
          <Button variant="secondary" isFullWidth onClick={onCancel} isDisabled={isDisabled}>
            {cancelLabel}
          </Button>
        ) : null}

        {onConfirm ? (
          <Button variant="primary" isFullWidth onClick={onConfirm} isDisabled={isDisabled}>
            {confirmLabel}
          </Button>
        ) : null}
      </div>
    ) : null;

  return (
    <Card
      {...cardProps}
      size="auto"
      hasBackButton={!!onBackButtonClick}
      onBackButtonClick={onBackButtonClick}
      customIcon={<XClose fontSize={24} color={"#666666"} />}
      footerElement={footerElement}
      children={children}
      isDisabled={isDisabled}
    />
  );
}
