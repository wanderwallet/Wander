import React from "react";
import styles from "./Header.module.css";
import { HeaderBaseProps } from "./Header.types";

import { Box, Text, Row, XClose, ChevronLeft } from "../../atoms";

const Header = React.forwardRef<HTMLDivElement, HeaderBaseProps>(
  (
    { className, titlePosition = "center", icon, title, subtitle, ...props },
    ref
  ) => {
    return (
      <Row
        ref={ref}
        className={`
        ${styles["header"]}
        ${className}`}
        {...props}
      >
        <Box
          className={`
            ${styles["header__title__container"]}
            ${styles[`header__title__container__${titlePosition}`]}
            `}
        >
          {icon}
          {title && (
            <Text variant="headingLg" alignment="center">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text variant="bodyMd" alignment="center">
              {subtitle}
            </Text>
          )}
        </Box>
      </Row>
    );
  }
);

Header.displayName = "Header";

export { Header };
