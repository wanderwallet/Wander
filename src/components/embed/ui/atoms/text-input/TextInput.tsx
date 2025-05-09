import clsx from "clsx";
import type { TextInputProps } from "./TextInput.types";

import styles from "./TextInput.module.scss";

export function TextInput({
  // React.InputHTMLAttributes<HTMLInputElement:
  type = "text",
  name,
  placeholder,
  defaultValue,
  value,
  onChange,
  disabled,
  readOnly,

  // Custom input props:
  inputRef,
  startSlot,
  endSlot,

  // Root element props:
  className,
  style,
}: TextInputProps) {
  return (
    <label className={clsx(styles["wrapper"], className)} style={style}>
      { startSlot }
      <input
        ref={inputRef}
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        className={styles["input"]}
        disabled={disabled}
        readOnly={readOnly} />
      { endSlot}
    </label>
  );
}
