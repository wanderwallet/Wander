import { useCallback, useState } from "react";
import { TextInput } from "~components/embed";
import { Eye, EyeOff } from "@untitled-ui/icons-react";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import type { TextInputProps } from "~components/embed/ui/atoms/text-input/TextInput.types";

export type PasswordInputProps = Omit<TextInputProps, "type">;

export function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleIsVisible = useCallback(() => {
    setIsVisible((prevIsVisible) => !prevIsVisible);
  }, []);

  const visibilityIcon = isVisible ? (
    <EyeOff
      aria-label="Hide password"
      style={{
        width: 22,
        height: 22,
        color: "var(--text-color-tertiary)",
      }}
    />
  ) : (
    <Eye
      aria-label="Show password"
      style={{
        width: 22,
        height: 22,
        color: "var(--text-color-tertiary)",
      }}
    />
  );

  const visibilityButton = <InputButton icon={visibilityIcon} tabIndex={-1} onClick={toggleIsVisible} />;

  return <TextInput {...props} type={isVisible ? "text" : "password"} endSlot={visibilityButton} />;
}
