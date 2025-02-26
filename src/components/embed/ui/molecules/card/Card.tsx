import React from "react";
import styles from "./Card.module.css";
import type { CardBaseProps } from "./Card.types";
import { Box, XClose, ChevronLeft } from "../../atoms";
import { Header } from "../header";
import { Footer } from "../footer";

const Card = React.forwardRef<HTMLDivElement, CardBaseProps>(
  (
    {
      headerText,
      headerIcon,
      subtitle,
      children,
      footerElement,
      className,
      hasShadow = false,
      isBlurry,
      size = "md",
      hasBackButton = true,
      hasCloseButton = true,
      onBackButtonClick,
      onCloseButtonClick,
      customIcon,
      ...props
    },
    ref
  ) => {
    const closeIcon = (
      <button
        className={styles["card__close__btn"]}
        onClick={onCloseButtonClick}
      >
        {customIcon ?? <XClose fontSize={24} color="#757575" />}
      </button>
    );
    return (
      <Box
        ref={ref}
        className={`
        ${styles["card"]}
        ${hasShadow && styles["card__shadow"]}
        ${isBlurry && styles["card__blury"]}
        ${size && styles[`card__${size}`]}
        ${className}
      `}
        {...props}
      >
        {hasBackButton && (
          <button
            className={styles["card__back__btn"]}
            onClick={onBackButtonClick}
          >
            <ChevronLeft fontSize={24} color="#757575" />
          </button>
        )}
        {hasCloseButton && closeIcon}
        {headerText && (
          <Header icon={headerIcon} title={headerText} subtitle={subtitle} />
        )}
        {children}
        {footerElement && <Footer children={footerElement} />}
      </Box>
    );
  }
);

Card.displayName = "Card";

export { Card };
