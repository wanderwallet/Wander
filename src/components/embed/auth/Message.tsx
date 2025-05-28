import browser from "webextension-polyfill";
import { useMemo, useState } from "react";
import { Box, Row, Text } from "../ui";

export default function Message({ message }: Props) {
  const [decodeType, setDecodeType] = useState("UTF-8");
  const availableDecodeTypes = ["utf-8", "hex", "ibm866", "mac", "windows-1251", "gbk", "utf-16"];

  // current message
  const msg = useMemo(() => {
    if (typeof message === "undefined") return "";
    const messageBytes = new Uint8Array(message);

    // handle hex
    if (decodeType === "hex") {
      return [...new Uint8Array(messageBytes.buffer)].map((v) => "0x" + v.toString(16).padStart(2, "0")).join(" ");
    }

    // handle other types
    return new TextDecoder(decodeType).decode(messageBytes);
  }, [message, decodeType]);

  return (
    <>
      <Row justifyContent="between">
        <Text variant="bodyMd" style={{ color: "#666666" }}>
          {browser.i18n.getMessage("signature_message")}
        </Text>
        <select
          value={decodeType}
          style={{
            fontWeight: "500",
            color: "#666666",
            outline: "none",
            border: "none",
            padding: "0",
            margin: "0",
            backgroundColor: "transparent",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
          onChange={(e) => setDecodeType(e.target.value)}>
          {availableDecodeTypes.map((type, i) => (
            <option value={type} key={i}>
              {type}
            </option>
          ))}
        </select>
      </Row>

      <Box
        alignment="left"
        style={{
          paddingLeft: 0,
          paddingRight: 0,
          border: "1px solid #E0E0E0",
          borderRadius: "8px",
          padding: "1rem",
          flex: 1,
        }}>
        <Text
          style={{
            fontSize: "0.9rem",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
            height: "200px",
            overflowY: "auto",
          }}>
          {msg}
        </Text>
      </Box>
    </>
  );
}

interface Props {
  message?: number[];
}
