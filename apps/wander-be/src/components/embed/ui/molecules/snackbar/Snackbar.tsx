import { InfoIcon } from "../../atoms";
import clsx from "clsx";
import { FormattedText } from "~components/embed/ui/atoms/formatted-text/FormattedText";
import React from "react";
import { AlertTriangle, XCircle, Check } from "@untitled-ui/icons-react";

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
  // TODO: Once we migrate to React 19:
  // ref?: React.Ref<HTMLDivElement>;
}

export const Snackbar = React.forwardRef<HTMLDivElement, SnackbarBaseProps>(
  ({ variant, title, className: classNameProp, children }: SnackbarBaseProps, ref) => {
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
  },
);
