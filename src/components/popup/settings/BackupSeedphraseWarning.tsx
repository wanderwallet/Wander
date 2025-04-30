import { ListItem } from "@arconnect/components-rebrand";
import { AlertTriangle } from "@untitled-ui/icons-react";
import { useTheme } from "styled-components";
import browser from "webextension-polyfill";

export interface BackupSeedphraseWarningProps {
  onClick?: () => void;
  showArrow?: boolean;
}

export function BackupSeedphraseWarning({
  onClick,
  showArrow = false
}: BackupSeedphraseWarningProps) {
  const theme = useTheme();

  return (
    <ListItem
      style={{
        borderRadius: 8,
        background: theme.displayTheme === "dark" ? "#363225" : "#F5F5F5",
        padding: "8px 12px"
      }}
      leftIcon={<AlertTriangle height={24} width={24} color="#EEBD41" />}
      titleStyle={{ fontWeight: 500, fontSize: 16 }}
      title={browser.i18n.getMessage("back_recovery_phrase")}
      hideSquircle
      showArrow={showArrow}
      onClick={onClick}
    />
  );
}
