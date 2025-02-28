import React from "react";
import styles from "./Footer.module.css";
import { FooterBaseProps } from "./Footer.types";

import { Box, Row, Text } from "../../atoms";

const Footer = React.forwardRef<HTMLDivElement, FooterBaseProps>(
  (
    { className, childrenPosition = "center", children, subtext, ...props },
    ref
  ) => {
    return (
      <Row
        ref={ref}
        className={`
        ${styles["footer"]}
        ${className}`}
        {...props}
      >
        <Box
          className={`
            ${styles["footer__title__container"]}
            `}
        >
          {children}
          {subtext && (
            <Text
              alignment={childrenPosition}
              className={styles["footer__text"]}
              variant={"bodyXs"}
            >
              {subtext}
            </Text>
          )}
        </Box>
      </Row>
    );
  }
);

Footer.displayName = "Footer";

export { Footer };
