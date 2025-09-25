import React from "react";
import type { CardBaseProps } from "./Card.types";
import { Box, ChevronLeft, Button, XClose } from "../../atoms";
import { Header } from "../header";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useLocation } from "~wallets/router/router.utils";
import { Loading } from "@arconnect/components";
import { NoUnpartitionedStateBanner } from "~components/embed/ui/templates/no-unpartitioned-state-banner/NoUnpartitionedStateBanner";
import clsx from "clsx";

import styles from "./Card.module.css";

const Card = React.forwardRef<HTMLDivElement, CardBaseProps>(
  (
    {
      headerText,
      headerIcon,
      subtitle,
      children,
      footerElement,
      className,
      isDisabled,
      isLoading,
      hasBackButton = true,
      hasCloseButton = true,
      onBackButtonClick,
      onCloseButtonClick,
      customIcon,
      withExtraPadding,
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
      <Button
        variant="invisible"
        className={styles["card__close__btn"]}
        onClick={onCloseButtonClick ?? closeCard}
        isDisabled={isDisabled || isLoading}>
        {customIcon ?? <XClose fontSize={24} style={{ color: "var(--color-font-body)", margin: 0 }} />}
      </Button>
    ) : null;

    const backButton = hasBackButton ? (
      <Button
        variant="invisible"
        className={styles["card__back__btn"]}
        onClick={onBackButtonClick ?? back}
        isDisabled={isDisabled || isLoading}>
        <ChevronLeft fontSize={24} style={{ color: "var(--color-font-body)", margin: 0 }} />
      </Button>
    ) : null;

    // TODO: Use CSS shape-outside for the buttons and use <header> and <footer>. Also address all those paddings...

    const rootClassName = clsx(styles.card, className, {
      [styles.card__disabled]: isDisabled || isLoading,
      [styles.withExtraPadding]: withExtraPadding,
    });

    return (
      <Box ref={ref} className={rootClassName} {...props}>
        <NoUnpartitionedStateBanner className={styles.banner} disableLink={isDisabled || isLoading} />

        <header className={styles.header}>
          {backButton}
          {closeButton}
          {headerText && <Header icon={headerIcon} title={headerText} subtitle={subtitle} />}
        </header>

        {children}
        <div style={{ marginTop: "auto" }}></div>
        {footerElement}

        <div className={styles["card__loaderCover"]}>
          {isLoading ? (
            <Loading
              style={{
                position: "absolute",
                top: "calc(50% - 16px)",
                left: "calc(50% - 16px)",
                width: "32px",
                height: "32px",
              }}
            />
          ) : null}
        </div>
      </Box>
    );
  },
);

Card.displayName = "Card";

export { Card };
