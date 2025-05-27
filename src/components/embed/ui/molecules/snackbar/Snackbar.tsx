import { InfoIcon } from "../../atoms";
import clsx from "clsx";
import { FormattedText } from "~components/embed/ui/atoms/formatted-text/FormattedText";
import type React from "react";
import { AlertTriangle, XCircle, Check } from "@untitled-ui/icons-react";
import { motion } from "framer-motion";

import styles from "./Snackbar.module.scss";

export type SnackbarVariant = "info" | "warning" | "error" | "success";

const SNACKBAR_ICON_BY_VARIANT: Record<SnackbarVariant, (props: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  info: InfoIcon,
  warning: AlertTriangle,
  error: XCircle,
  success: Check,
};

export interface SnackbarBaseProps extends FormattedText {
  variant: SnackbarVariant;
  title?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function Snackbar({ variant, title, className: classNameProp, children, ref }: SnackbarBaseProps) {
  if (!children) return null;

  const className = clsx(
    styles.root,
    styles[`${variant}Variant`],
    styles[`${title ? "with" : "no"}Title`],
    classNameProp,
  );
  const Icon = SNACKBAR_ICON_BY_VARIANT[variant];
  const icon = Icon ? <Icon className={styles.icon} /> : null;

  return (
    <div className={className} ref={ref}>
      {title ? (
        <strong className={styles.title}>
          {icon} {title}
        </strong>
      ) : (
        icon
      )}

      <FormattedText className={styles.content}>{children}</FormattedText>
    </div>
  );
}

export const MotionSnackbar = motion.create(Snackbar);
