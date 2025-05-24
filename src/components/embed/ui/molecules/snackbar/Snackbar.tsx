import { InfoIcon, Text, WarningIcon } from "../../atoms";
import clsx from "clsx";
import { FormattedText } from "~components/embed/ui/atoms/formatted-text/FormattedText";

import styles from "./Snackbar.module.scss";
import type React from "react";
import { AlertTriangle } from "@untitled-ui/icons-react";

export type SnackbarVariant = "info" | "warning" | "error";

const SNACKBAR_ICON_BY_VARIANT: Record<SnackbarVariant, (props: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  info: InfoIcon,
  warning: AlertTriangle,
  //warning: WarningIcon,
  error: null,
};

export interface SnackbarBaseProps extends FormattedText {
  variant: SnackbarVariant;
  tag?: React.ComponentType | keyof JSX.IntrinsicElements;
  //textColor?: string;
  // icon?: React.ReactNode;
  // iconColor?: string;
  // borderColor?: string;
  // backgroundColor?: string;
}

export function Snackbar({ variant, tag: Root = "div", className: classNameProp, children }: SnackbarBaseProps) {
  const className = clsx(styles.root, styles[`${variant}Variant`], classNameProp);

  const Icon = SNACKBAR_ICON_BY_VARIANT[variant];
  const icon = Icon ? <Icon className={styles.icon} /> : null;

  // width={20} height={20}

  // TODO: Add an optional title that removes the left padding.

  // TODO: Swap FormattedText and div

  return (
    <Root className={className}>
      {icon}

      <FormattedText className={styles.content}>{children}</FormattedText>
    </Root>
  );
}

/*

connect-settings.view.tsx had:

  backgroundColor="var(--color-background-default)"
  iconColor="var(--color-font-body)"
  textColor="var(--color-font-body)"

---

account-export-wallet.view.tsx had:

  backgroundColor="#FFF9EA"
  borderColor="#F2DC1320"
  textColor="#757575"
  iconColor="#BD8802"

---

backup-wallet-copy-seedphrase.tsx had:

  backgroundColor="#FFF9EA"
  borderColor="#F2DC1320"
  textColor="#121212"
  iconColor="#BD8802"

---

backup-full-wallet.view.tsx had:

  backgroundColor="#FFF9EA"
  borderColor="#F2DC1320"
  textColor="#121212"
  iconColor="#BD8802"

---

NoUnpartitionedStorageBanner.tsx had:


  background-color: #ffe3ba;
  color: #663c00;

*/
