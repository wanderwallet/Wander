import type { PropsWithChildren } from "react";
import clsx from "clsx";
import React, { isValidElement } from "react";

import styles from "./FormattedText.module.scss";

export interface FormattedText extends PropsWithChildren {
  className?: string;
}

// TODO: Add support for more text styling options.

export function FormattedText({ className, children }: FormattedText) {
  const childArray = React.Children.toArray(children)
    .flatMap((child) => {
      return typeof child === "string" ? child.split("\n") : child;
    })
    .filter(Boolean);

  return (
    <div className={clsx(styles.root, className)}>
      {childArray.map((child, i) => {
        return isValidElement(child) && child.type === "p" ? child : <p key={i}>{child}</p>;
      })}
    </div>
  );
}
