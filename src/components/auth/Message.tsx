import { Card, Spacer, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { useMemo, useState } from "react";
import styled from "styled-components";

export default function Message({ message }: Props) {
  // message decode type
  const [decodeType, setDecodeType] = useState("UTF-8");
  const availableDecodeTypes = [
    "utf-8",
    "hex",
    "ibm866",
    "mac",
    "windows-1251",
    "gbk",
    "utf-16"
  ];

  // current message
  const msg = useMemo(() => {
    if (typeof message === "undefined") return "";
    const messageBytes = new Uint8Array(message);

    // handle hex
    if (decodeType === "hex") {
      return [...new Uint8Array(messageBytes.buffer)]
        .map((v) => "0x" + v.toString(16).padStart(2, "0"))
        .join(" ");
    }

    // handle other types
    return new TextDecoder(decodeType).decode(messageBytes);
  }, [message, decodeType]);

  return (
    <>
      <MessageHeader>
        <Text noMargin>{browser.i18n.getMessage("signature_message")}</Text>
        <EncodingSelect onChange={(e) => setDecodeType(e.target.value)}>
          {availableDecodeTypes.map((type, i) => (
            <option value={type} key={i} selected={type === decodeType}>
              {type}
            </option>
          ))}
        </EncodingSelect>
      </MessageHeader>
      <Spacer y={0.3} />
      <Card smallPadding>
        <MessageText>{msg}</MessageText>
      </Card>
    </>
  );
}

interface Props {
  message?: number[];
}

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  p,
  select {
    font-size: 0.95rem;
  }
`;

const EncodingSelect = styled.select`
  font-weight: 500;
  color: ${(props) => props.theme.secondaryText};
  outline: none;
  border: none;
  padding: 0;
  margin: 0;
  background-color: transparent;
`;

const MessageText = styled.div`
  font-size: 0.9rem;
  word-wrap: break-word;
  white-space: pre-wrap;
  height: 200px;
  overflow-y: auto;
`;
