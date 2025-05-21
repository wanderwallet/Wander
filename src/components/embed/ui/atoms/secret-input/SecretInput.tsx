import { useCallback, useRef, useState } from "react";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import copy from "copy-to-clipboard";
import clsx from "clsx";
import { Loading } from "@arconnect/components";
import { Copy01, Eye, EyeOff } from "@untitled-ui/icons-react";
import { CheckIcon } from "~components/embed/ui";

import styles from "./SecretInput.module.scss";

export interface SecretInputProps {
  className?: string;
  secret?: string;
  isLoading?: boolean;
}

export function SecretInput({
  className: classNameProp,
  secret,
  isLoading,
}: SecretInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const timeoutIdRef = useRef(0);

  const copySecret = useCallback(async () => {
    window.clearTimeout(timeoutIdRef.current);

    await copy(secret);

    setIsCopied(true);

    timeoutIdRef.current = window.setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  }, [secret]);

  const copyIcon = isCopied ? (
    <CheckIcon
      style={{
        width: 22,
        height: 22,
        color: "#22c55e",
      }}/>
  ) : (
    <Copy01
      style={{
        width: 22,
        height: 22,
        color: "var(--text-color-tertiary)",
      }}/>
  );

  const copyButton = (
    <InputButton
      variant="icon"
      label={isCopied ? "Copied" : "Copy"}
      icon={ copyIcon }
      disabled={ isLoading }
      onClick={ copySecret } />
  );

  const toggleIsVisible = useCallback(() => {
    setIsVisible(prevIsVisible => !prevIsVisible);
  }, []);

  const visibilityIcon = isVisible ? (
    <EyeOff
      aria-label="Hide secret"
      style={{
        width: 22,
        height: 22,
        color: "var(--text-color-tertiary)",
      }}
    />) : (
    <Eye
      aria-label="Show secret"
      style={{
        width: 22,
        height: 22,
        color: "var(--text-color-tertiary)",
      }}
    />
  );

  const visibilityButton = (
    <InputButton
      icon={ visibilityIcon }
      disabled={ isLoading }
      onClick={ toggleIsVisible }
      tabIndex={-1} />
  );

  const className = clsx(styles.root, {
    [styles.isVisible]: isVisible,
    [styles.isLoading]: isLoading,
  }, classNameProp);

  return (
    <div className={ className }>
      <div className={ styles.secret }>
        { secret }

        <span className={ styles.loaderCover }>
          { isLoading ? (
            <Loading />
          ) : null }
        </span>
      </div>

      <div className={ styles.buttons }>
        { copyButton }
        { visibilityButton }
      </div>
    </div>
  );
}
