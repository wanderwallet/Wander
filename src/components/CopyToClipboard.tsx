import { useEffect, useState } from "react";
import styled from "styled-components";
import { Text, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import copy from "copy-to-clipboard";
import { Check, Copy02 } from "@untitled-ui/icons-react";

interface CopyToClipboardProps {
  text: string;
  copySuccess?: string;
  iconSize?: number;
  label?: string;
  labelStyle?: React.CSSProperties;
  labelAs?: React.ElementType;
  showToast?: boolean;
  onCopy?: (isCopied: boolean) => void;
}

const CopyButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  border: none;
  background: none;
  gap: 8px;
`;

const Label = styled(Text).attrs({
  noMargin: true
})`
  overflow: hidden;
`;

export function CopyToClipboard({
  text,
  copySuccess,
  iconSize = 16,
  label,
  labelStyle,
  showToast = true,
  onCopy,
  labelAs = Label
}: CopyToClipboardProps) {
  const toast = useToasts();
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsCopied(false);
    try {
      copy(text || "");
      if (showToast) {
        toast.setToast({
          type: "success",
          content: copySuccess || browser.i18n.getMessage("copied"),
          duration: 2400
        });
      }
      setIsCopied(true);
      if (onCopy) onCopy(true);
    } catch (err) {
      if (showToast) {
        toast.setToast({
          type: "error",
          content: browser.i18n.getMessage("copy_failed"),
          duration: 2400
        });
      }
    }
  };

  useEffect(() => {
    if (!isCopied) return;

    const timeout = setTimeout(() => {
      setIsCopied(false);
      if (onCopy) onCopy(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isCopied]);

  return (
    <CopyButton onClick={copyToClipboard}>
      {label && (
        <Label as={labelAs} style={labelStyle}>
          {label}
        </Label>
      )}
      <Icon
        as={isCopied ? Check : Copy02}
        height={iconSize}
        width={iconSize}
        success={isCopied}
      />
    </CopyButton>
  );
}

const Icon = styled.div<{ height: number; width: number; success: boolean }>`
  height: ${(props) => props.height}px;
  width: ${(props) => props.width}px;
  color: ${(props) =>
    props.success ? props.theme.success : props.theme.tertiaryText};
`;
