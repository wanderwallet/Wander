import type { IBridgeMessage, ProtocolMap } from "@arconnect/webext-bridge";

// sendMessage():

export type MessageID = keyof ProtocolMap;

export type MessageDestination = "background" | `web_accessible@${number}` | `content-script@${number}`;

export interface MessageData<K extends MessageID> {
  destination: MessageDestination;
  messageId: K;
  data: ProtocolMap[K]["data"];
}

// onMessage():

export type OnMessageCallback<K extends MessageID> = (
  message: Omit<IBridgeMessage<any>, "data"> & { data: ProtocolMap[K]["data"] },
) => ProtocolMap[K]["return"] | Promise<ProtocolMap[K]["return"]>;
