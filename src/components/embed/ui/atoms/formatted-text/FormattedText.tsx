import type { PropsWithChildren } from "react";
import clsx from "clsx";
import React from "react";

import styles from "./FormattedText.module.scss";

export interface FormattedText extends PropsWithChildren {
  className?: string;
}

export function FormattedText({ className, children }: FormattedText) {
  const childArray = React.Children.toArray(children).flatMap((child) => {
    return typeof child === "string" ? child.split("\n") : child;
  });

  console.log(childArray);

  return (
    <div className={clsx(styles.root, className)}>
      {childArray.map((child) => {
        return typeof child === "string" ? <p>{child}</p> : child;
      })}
    </div>
  );
}
