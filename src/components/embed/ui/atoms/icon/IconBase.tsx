import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";

export type IconBaseProps = {
  color?: string;
  fontSize?: number;
  className?: string;
  onClick?: () => void;
};

export const withThemeAwareColor = (
  IconComponent: React.ComponentType<IconBaseProps>
) => {
  const ThemedIcon: React.FC<IconBaseProps> = ({
    color,
    fontSize,
    className,
    onClick
  }) => {
    const { isDarkMode } = useTheme();

    const themeColor =
      color || (isDarkMode ? "var(--color-font-body)" : undefined);

    return (
      <IconComponent
        color={themeColor}
        fontSize={fontSize}
        className={className}
        onClick={onClick}
      />
    );
  };

  return ThemedIcon;
};
