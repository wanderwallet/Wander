import React from "react";
import styles from "./Card.module.css";
import { CardBaseProps } from "./Card.types";
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
      hasShadow,
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
    const closeIcon = customIcon ? (
      customIcon
    ) : (
      <XClose
        className={styles["card__close__btn"]}
        fontSize={24}
        onClick={onCloseButtonClick}
        color="#757575"
      />
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
          <ChevronLeft
            className={styles["card__back__btn"]}
            fontSize={24}
            onClick={onBackButtonClick}
            color="#757575"
          />
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
