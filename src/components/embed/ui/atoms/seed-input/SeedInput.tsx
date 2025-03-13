import React, { forwardRef, useState, useEffect, type FormEvent } from "react";
import styles from "./SeedInput.module.css";
import type { SeedInputBaseProps } from "./SeedInput.types";
import { CopyableIcon } from "../icon";

const SeedInput = forwardRef<HTMLDivElement, SeedInputBaseProps>(
  (
    {
      className = "",
      size = 12,
      handleSubmit,
      handleCopyToClipboard,
      handleInputChange,
      seedPhrase = [],
      ...props
    },
    ref
  ) => {
    const Component = "div";
    const [numInputs, setNumInputs] = useState(size);
    const allowedSizes = [12, 18, 24];

    useEffect(() => {
      if (allowedSizes.includes(size)) {
        setNumInputs(size);
      }
    }, [size]);

    useEffect(() => {
      if (seedPhrase.length !== numInputs) {
        const updatedSeedPhrase = [...seedPhrase];

        if (seedPhrase.length < numInputs) {
          for (let i = seedPhrase.length; i < numInputs; i++) {
            updatedSeedPhrase.push("");
          }
        } else if (seedPhrase.length > numInputs) {
          updatedSeedPhrase.length = numInputs;
        }

        if (handleInputChange) {
          updatedSeedPhrase.forEach((word, index) => {
            handleInputChange(index, word);
          });
        }
      }
    }, [numInputs, seedPhrase]);

    const handleNumInputsChange = (value: number) => {
      setNumInputs(value);
    };

    const onSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (handleSubmit) {
        handleSubmit(e);
      }
    };

    const onCopy = () => {
      if (handleCopyToClipboard) {
        const completeSeedPhrase = seedPhrase.join(" ");
        handleCopyToClipboard(completeSeedPhrase);
      }
    };

    return (
      <Component
        className={`
          ${styles["seed-phrase-container"]}
          ${className}
        `}
        ref={ref}
        {...props}
      >
        <div className={styles["header"]}>
          <div className={styles["input-options"]}>
            {allowedSizes.map((sizeOption) => (
              <button
                key={sizeOption}
                type="button"
                className={`
                  ${styles["button"]}
                  ${sizeOption === numInputs ? styles["active"] : ""}
                `}
                onClick={() => handleNumInputsChange(sizeOption)}
              >
                {sizeOption}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles["copy-button"]}
            onClick={onCopy}
          >
            <CopyableIcon />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles["input-grid"]}>
            {Array.from({ length: numInputs }).map((_, index) => (
              <input
                key={index}
                type="text"
                value={seedPhrase[index] || ""}
                onChange={(e) =>
                  handleInputChange && handleInputChange(index, e.target.value)
                }
                placeholder={`${index + 1}`}
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
