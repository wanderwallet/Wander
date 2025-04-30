import { ListItem } from "@arconnect/components-rebrand";
import { AlertTriangle } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";

export interface BackupSeedphraseWarningProps {
  onClick?: () => void;
  showArrow?: boolean;
}

export function BackupSeedphraseWarning({
  onClick,
  showArrow = false
}: BackupSeedphraseWarningProps) {
  return (
    <ListItem
      style={{
        borderRadius: 8,
        background: "#363225",
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
