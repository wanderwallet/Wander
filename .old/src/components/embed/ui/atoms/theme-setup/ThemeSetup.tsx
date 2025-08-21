import React, { useEffect } from "react";
import { useTheme } from "../../../../../utils/theme/theme.hook";

export const ThemeSetup: React.FC = () => {
  const { setMode } = useTheme();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PARENT_THEME_UPDATE") {
        setMode(event.data.mode);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setMode]);

  return null;
};
