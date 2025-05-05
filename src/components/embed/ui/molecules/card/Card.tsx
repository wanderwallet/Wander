import React from "react";
import styles from "./Card.module.css";
import type { CardBaseProps } from "./Card.types";
import { Box, MinimizeIcon, ChevronLeft } from "../../atoms";
import { Header } from "../header";
import { Footer } from "../footer";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useLocation } from "~wallets/router/router.utils";

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
      closeButtonStyles,
      customIcon,
      ...props
    },
    ref
  ) => {
    const [isMinimized, setIsMinimized] = React.useState(false);
    const { back } = useLocation();

    const closeCard = () => {
      postEmbeddedMessage({
        type: "embedded_close",
        data: null
      });
    };

    const closeIcon = (
      <button
        style={closeButtonStyles}
        className={styles["card__close__btn"]}
        onClick={onCloseButtonClick ?? closeCard}
      >
        {customIcon ?? (
          <MinimizeIcon
            fontSize={24}
            style={{ color: "var(--color-font-body)" }}
          />
        )}
      </button>
    );

    return (
      <Box
        ref={ref}
        className={`
        ${styles["card"]}
        ${hasShadow && styles["card__shadow"]}
        ${isBlurry && styles["card__blurry"]}
        ${size && styles[`card__${size}`]}
        ${isMinimized && styles[`card_minimized__active`]}
        ${className}
      `}
        {...props}
      >
        {!isMinimized ? (
          <>
            {hasBackButton && (
              <button
                className={styles["card__back__btn"]}
                onClick={onBackButtonClick ?? back}
              >
                <ChevronLeft
                  fontSize={24}
                  style={{ color: "var(--color-font-body)" }}
                />
              </button>
            )}
            {hasCloseButton && closeIcon}
            {headerText && (
              <Header
                icon={headerIcon}
                title={headerText}
                subtitle={subtitle}
              />
            )}
            {children}
            <div style={{ marginTop: "auto" }}></div>
            {footerElement && <Footer children={footerElement} />}
          </>
        ) : (
          <button
            id="toggleBtn"
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              width: "100%",
              height: "100%",
              zIndex: 100,
              cursor: "pointer"
            }}
          />
        )}
      </Box>
    );
  }
);

Card.displayName = "Card";

export { Card };
