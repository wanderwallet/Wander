import { useMemo, useState, type PropsWithChildren } from "react";

import styles from "./figma-screen.module.scss";
import { DevButtons, type DevButtonProps } from "../button/button.component";
import { asArray, getFriendlyErrorMessage, isPromise } from "@wanderapp/core";
import { DevSpinnerCover } from "../spinner-cover/spinner-cover.component";

interface DevFigmaScreenState {
  isLoading: boolean;
  errorMessage: string | boolean;
}

export interface DevFigmaScreenProps extends PropsWithChildren {
  title: string;
  description?: string | string[];
  src: string;
  config?: DevButtonProps[];
  width?: number;
  isLoading?: boolean;
}

export function DevFigmaScreen({
  title,
  description,
  src,
  config: configProp,
  width = 420,
  isLoading: isLoadingProp,
  children,
}: DevFigmaScreenProps) {
  const [screenState, setScreenState] = useState<DevFigmaScreenState>({
    isLoading: false,
    errorMessage: false,
  });

  const isLoading = isLoadingProp || screenState.isLoading;
  const { errorMessage } = screenState;

  const config = useMemo(() => {
    if (!configProp) return undefined;

    return configProp.map((buttonConfig) => {
      if (!buttonConfig.onClick) return buttonConfig;

      const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        try {
          const onClickReturn = buttonConfig.onClick(e);

          if (isPromise(onClickReturn)) {
            setScreenState({
              isLoading: true,
              errorMessage: false,
            });

            onClickReturn
              .then((value) => {
                setScreenState({
                  isLoading: false,
                  errorMessage: false,
                });

                return value;
              })
              .catch((asyncErr) => {
                console.log(asyncErr);

                setScreenState({
                  isLoading: false,
                  errorMessage: getFriendlyErrorMessage(asyncErr),
                });
              });
          }

          return onClickReturn;
        } catch (err) {
          console.log(err);

          setScreenState({
            isLoading: false,
            errorMessage: getFriendlyErrorMessage(err),
          });
        }
      };

      return {
        ...buttonConfig,
        onClick,
      };
    });
  }, [configProp]);

  return (
    <div className={styles.root} style={{ width: `${width}px` }}>
      <h1 className={styles.title}>{title}</h1>

      {description
        ? asArray(description).map((descriptionLine, i) => {
            return (
              <p key={i} className={styles.p}>
                {descriptionLine}
              </p>
            );
          })
        : null}

      <img className={styles.img} src={src} />

      {children || config || errorMessage ? (
        <div className={styles.children}>
          {children}
          {errorMessage ? (
            <p className={styles.errorMessage}>{errorMessage === true ? "Unexpected error." : errorMessage}</p>
          ) : null}
          {config ? <DevButtons config={config} isDisabled={isLoading} /> : null}
        </div>
      ) : null}

      {isLoading ? <DevSpinnerCover /> : null}
    </div>
  );
}
