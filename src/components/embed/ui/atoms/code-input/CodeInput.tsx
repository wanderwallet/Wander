import { Flex } from "~components/common/Flex";
import { useCallback, useImperativeHandle, useRef } from "react";
import { OTP_LENGTH } from "~utils/otp/otp.utils";

import styles from "./CodeInput.module.scss";

export interface CodeInputHandle {
  getCode(): string;
  clear(): void;
}

export interface CodeInputProps {
  className?: string;
  name: string;
  inputRef: React.MutableRefObject<CodeInputHandle>;
  onChange?: (code: string, isComplete: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export function CodeInput({ className, name, inputRef, onChange, disabled, readOnly, autoFocus }: CodeInputProps) {
  const inputRefs = useRef<HTMLInputElement[]>(new Array(OTP_LENGTH).fill(null));

  const getCode = useCallback(() => {
    const inputs = inputRefs.current;

    if (!inputs) throw new Error("No inputs");

    return inputs.map((input) => input.value.trim()).join("");
  }, []);

  const clear = useCallback(() => {
    const inputs = inputRefs.current;

    if (!inputs) throw new Error("No inputs");

    const prevCode = getCode();

    for (let i = 0; i < OTP_LENGTH; ++i) {
      inputs[i].value = "";
    }

    if (prevCode !== "" && onChange) onChange("", false);
  }, [getCode, onChange]);

  const focusInput = useCallback((inputOrIndex: HTMLInputElement | number) => {
    const input =
      typeof inputOrIndex === "number"
        ? inputRefs.current[Math.min(Math.max(inputOrIndex, 0), OTP_LENGTH - 1)]
        : inputOrIndex;

    if (!input) return;

    input.focus();

    requestAnimationFrame(() => {
      input.select();
    });
  }, []);

  useImperativeHandle(inputRef, () => {
    return {
      getCode,
      clear,
    } satisfies CodeInputHandle;
  }, [getCode, clear]);

  const handleInputOrPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();

      const inputs = inputRefs.current;
      const rawValue =
        "clipboardData" in e ? e.clipboardData.getData("text/plain").trim() : e.currentTarget.value.trim();
      const sanitizedValue = rawValue.replace(/[^0-9]/g, "");
      const currentIndex = parseInt(e.currentTarget.name.replace("otp-input-", "")) || 0;

      if (!inputs) return;

      let nextEmptyIndex = currentIndex;

      if (sanitizedValue.length === OTP_LENGTH) {
        // Fill in digits starting from the start:
        for (let i = 0; i < OTP_LENGTH; ++i) {
          inputs[i].value = sanitizedValue[i];
        }
        nextEmptyIndex = OTP_LENGTH - 1;
      } else if (sanitizedValue) {
        // Fill in digits starting from the current position:
        for (let i = currentIndex; i < OTP_LENGTH; ++i) {
          const inputValue = sanitizedValue[i - currentIndex];

          if (inputValue) {
            inputs[i].value = inputValue;
            nextEmptyIndex = i + 1;
          }
        }
      } else {
        e.currentTarget.value = "";
      }

      // Focus next empty input or last one:
      focusInput(Math.min(nextEmptyIndex, OTP_LENGTH - 1));

      if (onChange) {
        const code = getCode();

        onChange(code, code.length === OTP_LENGTH);
      }
    },
    [focusInput, getCode],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const currentIndex = parseInt(e.currentTarget.name.replace("otp-input-", "")) || 0;

      switch (e.key) {
        case "Backspace":
        case "Delete":
          if (e.currentTarget.value) {
            e.currentTarget.value = "";
          } else {
            focusInput(currentIndex - 1);
          }
          break;
        case "ArrowUp":
          focusInput(0);
          break;
        case "ArrowLeft":
          focusInput(currentIndex - 1);
          break;
        case "ArrowRight":
          focusInput(currentIndex + 1);
          break;
        case "ArrowDown":
          focusInput(OTP_LENGTH - 1);
          break;
      }
    },
    [focusInput],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      focusInput(e.currentTarget);
    },
    [focusInput],
  );

  return (
    <Flex direction="row" gap={8} width="100%" justify="center" className={className}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          type="text"
          className={styles["input"]}
          name={`${name}-${index}`}
          ref={(el) => (inputRefs.current[index] = el)}
          maxLength={1}
          disabled={disabled}
          readOnly={readOnly}
          onInput={handleInputOrPaste}
          onPaste={handleInputOrPaste}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          autoFocus={autoFocus && index === 0}
        />
      ))}
    </Flex>
  );
}
