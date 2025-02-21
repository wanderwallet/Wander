import React, { forwardRef, useState } from "react";
import styles from "./SeedInput.module.css";
import type { SeedInputBaseProps } from "./SeedInput.types";
import { CopyableIcon } from "../icon";

const SeedInput = forwardRef<HTMLDivElement, SeedInputBaseProps>(
  (
    {
      className,
      size = 12,
      handleSubmit,
      handleCopyToClipboard,
      handleInputChange,
      ...props
    },
    ref
  ) => {
    const Component = "div";
    const [numInputs, setNumInputs] = useState(12);
    const [seedPhrase, setSeedPhrase] = useState(Array(12).fill(""));

    const allowedSizes = [12, 18, 24];

    const handleNumInputsChange = (value: number) => {
      setNumInputs(value);
      setSeedPhrase(Array(value).fill(""));
    };

    return (
      <Component
        className={`
        ${styles["seed-phrase-container"]}
        ${styles[`seed__${size}`]}
        ${className}
      `}
        ref={ref}
        {...props}
      >
        <div className={styles["header"]}>
          <div className={styles["input-options"]}>
            {allowedSizes.map((size) => (
              <button
                key={size}
                className={`
              ${styles["button"]}
              ${size === numInputs ? styles["active"] : ""}
              ${className}
            `}
                onClick={() => handleNumInputsChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
          <CopyableIcon
            onClick={handleCopyToClipboard}
            className={styles["copy-button"]}
          />
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles["input-grid"]}>
            {seedPhrase.map((word, index) => (
              <input
                key={index}
                type="text"
                value={word}
                onChange={(e) => handleInputChange(index, e.target.value)}
                // @ts-ignore
                placeholder={index + 1}
                required
              />
            ))}
          </div>
        </form>
      </Component>
    );
  }
);

SeedInput.displayName = "SeedInput";

export { SeedInput };
