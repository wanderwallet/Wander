import type { CommonRouteProps } from "~wallets/router/router.types";
import { TransactionView, type TransactionViewParams } from "../transaction/[id]";

export interface MessageNotificationViewParams {
  id: string;
}

export type MessageNotificationViewProps = CommonRouteProps<MessageNotificationViewParams>;

export function MessageNotificationView({ params: { id } }: MessageNotificationViewProps) {
  const params: TransactionViewParams = {
    id,
    message: true,
  };

  return <TransactionView params={params} />;
}
