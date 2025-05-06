import React from "react";
import styles from "./Card.module.css";
import type { CardBaseProps } from "./Card.types";
import { Box, MinimizeIcon, ChevronLeft } from "../../atoms";
import { Header } from "../header";
import { Footer } from "../footer";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useLocation } from "~wallets/router/router.utils";
import { Loading } from "@arconnect/components";

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
      isDisabled,
      isLoading,
      size = "md",
      hasBackButton = true,
      hasCloseButton = true,
      onBackButtonClick,
      onCloseButtonClick,
      closeButtonStyles,
      customIcon,
      ...props
    },
    ref,
  ) => {
    const { back } = useLocation();

    const closeCard = () => {
      postEmbeddedMessage({
        type: "embedded_close",
        data: null,
      });
    };

    const closeButton = hasCloseButton ? (
      <button
        style={closeButtonStyles}
        className={styles["card__close__btn"]}
        onClick={onCloseButtonClick ?? closeCard}
        disabled={ isDisabled || isLoading }>
        {customIcon ?? <MinimizeIcon fontSize={24} style={{ color: "var(--color-font-body)" }} />}
      </button>
    ) : null;

    const backButton = hasBackButton ? (
      <button
        className={styles["card__back__btn"]}
        onClick={onBackButtonClick ?? back}
        disabled={ isDisabled || isLoading }>
        <ChevronLeft fontSize={24} style={{ color: "var(--color-font-body)" }} />
      </button>
    ) : null;

    return (
      <Box
        ref={ref}
        className={`
        ${styles["card"]}
        ${hasShadow && styles["card__shadow"]}
        ${(isDisabled || isLoading) && styles["card__disabled"]}
        ${size && styles[`card__${size}`]}
        ${className}
      `}
        {...props}>
        {backButton}
        {closeButton}
        {headerText && <Header icon={headerIcon} title={headerText} subtitle={subtitle} />}
        {children}
        <div style={{ marginTop: "auto" }}></div>
        {footerElement && <Footer children={footerElement} />}

        { (isDisabled || isLoading) ? (
          <div className={ styles["card__loaderCover"]}>
            { isLoading ? (
              <Loading
                style={{
                  position: "absolute",
                  top: "calc(50% - 16px)",
                  left: "calc(50% - 16px)",
                  width: "32px",
                  height: "32px",
                }}
              />
            ) : null }
          </div>
        ) : null }
      </Box>
    );
  },
);

Card.displayName = "Card";

export { Card };
