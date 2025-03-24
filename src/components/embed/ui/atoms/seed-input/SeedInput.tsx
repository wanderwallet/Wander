import React, {
  forwardRef,
  useState,
  useEffect,
  type FormEvent,
  useRef
} from "react";
import styles from "./SeedInput.module.css";
import type { SeedInputBaseProps } from "./SeedInput.types";

const SeedInput = forwardRef<HTMLDivElement, SeedInputBaseProps>(
  (
    {
      className = "",
      size = 12,
      handleSubmit,
      handleInputChange,
      seedPhrase = [],
      ...props
    },
    ref
  ) => {
    const Component = "div";
    const [numInputs, setNumInputs] = useState(size);
    const allowedSizes = [12, 18, 24];
    const formRef = useRef<HTMLFormElement>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    // Handle pasting a complete seedphrase
    const handlePaste = (
      e: React.ClipboardEvent<HTMLInputElement>,
      currentIndex: number
    ) => {
      // Get pasted content
      const pastedText = e.clipboardData.getData("text");

      if (!pastedText) return;

      // Split by spaces and filter out empty entries
      const words = pastedText
        .trim()
        .replace(/\n/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 0);

      // Check if we have a valid seedphrase pattern (12, 18, or 24 words)
      if (allowedSizes.includes(words.length)) {
        e.preventDefault(); // Prevent default paste behavior

        // Update the number of inputs if needed
        if (words.length !== numInputs) {
          setNumInputs(words.length);
        }

        // Fill all inputs with the corresponding words
        words.forEach((word, index) => {
          if (handleInputChange) {
            handleInputChange(index, word);
          }
        });

        // If we have a submit handler, trigger it after filling the inputs
        if (handleSubmit && words.length === numInputs) {
          setTimeout(() => {
            if (formRef.current) {
              const event = new Event("submit", {
                cancelable: true,
                bubbles: true
              });
              formRef.current.dispatchEvent(event);
            }
          }, 100);
        }
      } else if (currentIndex < numInputs - 1 && words.length === 1) {
        // If it's a single word paste, let the default behavior occur
        // but focus the next input after paste completes
        setTimeout(() => {
          const nextInput = inputRefs.current[currentIndex + 1];
          if (nextInput) {
            nextInput.focus();
          }
        }, 0);
      }
    };

    // Handle key press to move between inputs
    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>,
      index: number
    ) => {
      if (e.key === "ArrowRight" && index < numInputs - 1) {
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) nextInput.focus();
      } else if (e.key === "ArrowLeft" && index > 0) {
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) prevInput.focus();
      } else if (e.key === "Enter") {
        if (index < numInputs - 1) {
          const nextInput = inputRefs.current[index + 1];
          if (nextInput) nextInput.focus();
        } else if (handleSubmit) {
          // If it's the last input, submit the form
          if (formRef.current) {
            const event = new Event("submit", {
              cancelable: true,
              bubbles: true
            }) as unknown as FormEvent;
            onSubmit(event);
          }
        }
      }
    };

    // Clear all inputs
    const clearAll = () => {
      if (handleInputChange) {
        for (let i = 0; i < numInputs; i++) {
          handleInputChange(i, "");
        }
        // Focus the first input after clearing
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
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
        </div>
        <form ref={formRef} onSubmit={onSubmit}>
          <div className={styles["input-grid"]}>
            {Array.from({ length: numInputs }).map((_, index) => (
              <div key={index} className={styles["input-container"]}>
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  value={seedPhrase[index] || ""}
                  onChange={(e) =>
                    handleInputChange &&
                    handleInputChange(index, e.target.value)
                  }
                  onPaste={(e) => handlePaste(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder={`${index + 1}`}
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        </form>
      </Component>
    );
  }
);

SeedInput.displayName = "SeedInput";

export { SeedInput };
