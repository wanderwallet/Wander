import {
  extractQuantityTransferred,
  fetchNotifications,
  fetchTokenById,
  fetchTokenByProcessId,
  mergeAndSortNotifications
} from "~utils/notifications";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { useLocation } from "~wallets/router/router.utils";
import { Text, Loading } from "@arconnect/components-rebrand";
import { formatAddress } from "~utils/format";
import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { useAo } from "~tokens/aoTokens/ao";
import styled from "styled-components";
import { balanceToFractioned, formatTokenBalance } from "~tokens/currency";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import {
  SubscriptionStatus,
  type SubscriptionData
} from "~subscriptions/subscription";
import { checkTransactionError } from "~lib/transactions";
import type { Transaction } from "~api/background/handlers/alarms/notifications/notifications-alarm.utils";
import { MessageDotsCircle, Wallet02 } from "@untitled-ui/icons-react";
import { HorizontalLine } from "~components/HorizontalLine";

export function NotificationsView() {
  const { navigate } = useLocation();

  const [notifications, setNotifications] = useState<Transaction[]>([]);
  const [formattedTxMsgs, setFormattedTxMsgs] = useState<string[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);

  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const ao = useAo();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const address = await getActiveAddress();
        const n = await fetchNotifications(address);
        const subs = (
          (await ExtensionStorage.get<SubscriptionData[]>(
            `subscriptions_${address}`
          )) || []
        ).filter(
          (subscription) =>
            subscription.subscriptionStatus ===
            SubscriptionStatus.AWAITING_PAYMENT
        );

        setSubscriptions(subs);
        if (!n && subs.length === 0) {
          setEmpty(true);
        }
        const sortedNotifications = mergeAndSortNotifications(
          n.arBalanceNotifications.arNotifications,
          n.aoNotifications.aoNotifications
        );
        const { formattedTxMsgs, formattedNotifications } =
          await formatTxMessage(sortedNotifications);
        setNotifications(formattedNotifications);
        setFormattedTxMsgs(formattedTxMsgs);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
        setFormattedTxMsgs(["Error fetching messages"]);
      }
    })();
  }, []);

  const findRecipient = (n) => {
    const recipientTag = n.node.tags.find((t) => t.name === "Recipient");
    if (recipientTag) {
      return formatAddress(recipientTag.value, 4);
    }
    return "Recipient not found";
  };

  const formatTxMessage = async (
    notifications: Transaction[]
  ): Promise<{
    formattedTxMsgs: string[];
    formattedNotifications: Transaction[];
  }> => {
    const address = await getActiveAddress();

    let formattedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        try {
          const hasError = await checkTransactionError(notification);
          if (hasError) {
            return { formattedMessage: null, notification };
          }

          let formattedMessage: string = "";
          if (notification.transactionType === "PrintArchive") {
            formattedMessage = browser.i18n.getMessage("print_archived");
          } else if (notification.transactionType !== "Message") {
            let ticker: string;
            let quantityTransfered;
            if (notification.isAo) {
              // handle ao messages/sents/receives
              let token = await fetchTokenByProcessId(notification.tokenId);
              if (!token) {
                ticker = formatAddress(notification.tokenId, 4);
                quantityTransfered = notification.quantity;
              } else {
                ticker =
                  token?.type === "collectible"
                    ? token.Name! || token.Ticker!
                    : token.Ticker! || token.Name!;
                quantityTransfered = balanceToFractioned(
                  notification.quantity,
                  {
                    id: notification.tokenId,
                    decimals: token.Denomination,
                    divisibility: token.Denomination
                  }
                ).toFixed();
              }
            } else if (notification.transactionType !== "Transaction") {
              let token = await fetchTokenById(notification.tokenId);
              if (!token) {
                ticker = formatAddress(notification.tokenId, 5);
                quantityTransfered = extractQuantityTransferred(
                  notification.node.tags
                );
              } else if (token.ticker !== "AR") {
                ticker = token.ticker;
                quantityTransfered = extractQuantityTransferred(
                  notification.node.tags
                );
                quantityTransfered = formatTokenBalance(
                  balanceToFractioned(quantityTransfered, {
                    id: notification.tokenId,
                    decimals: token.decimals,
                    divisibility: token.divisibility
                  })
                );
              } else {
                ticker = token.ticker;
                quantityTransfered = formatTokenBalance(
                  notification.quantity || "0"
                );
              }
            }
            if (notification.transactionType === "Sent") {
              formattedMessage = browser.i18n.getMessage("sent_balance", [
                quantityTransfered,
                ticker,
                notification.isAo
                  ? findRecipient(notification)
                  : formatAddress(notification.node.recipient, 4)
              ]);
            } else if (notification.transactionType === "Received") {
              formattedMessage = browser.i18n.getMessage("received_balance", [
                quantityTransfered,
                ticker,
                formatAddress(notification.node.owner.address, 4)
              ]);
            } else {
              const recipient = notification.node.recipient;
              const sender = notification.node.owner.address;
              const isSent = sender === address;
              const contentTypeTag = notification.node.tags.find(
                (tag) => tag.name === "Content-Type"
              );
              if (!recipient && contentTypeTag) {
                formattedMessage = browser.i18n.getMessage("new_data_uploaded");
              } else if (!recipient) {
                formattedMessage = `${browser.i18n.getMessage(
                  "new_transaction"
                )} ${browser.i18n.getMessage("sent").toLowerCase()}`;
              } else {
                formattedMessage = `${browser.i18n.getMessage(
                  "new_transaction"
                )} ${browser.i18n.getMessage(
                  isSent ? "notification_to" : "notification_from"
                )} ${formatAddress(isSent ? recipient : sender, 4)}`;
              }
            }
          } else {
            const recipient = notification.node.recipient;
            const sender = notification.node.owner.address;
            const isSent = sender === address;
            formattedMessage = `${browser.i18n.getMessage(
              "new_message"
            )} ${browser.i18n.getMessage(
              isSent ? "notification_to" : "notification_from"
            )} ${formatAddress(isSent ? recipient : sender, 4)}`;
          }
          return { formattedMessage, notification };
        } catch {
          return { formattedMessage: null, notification };
        }
      })
    );

    formattedNotifications = formattedNotifications.filter(
      (notification) => notification.formattedMessage
    );

    const formattedTxMsgs = formattedNotifications.map(
      (notification) => notification.formattedMessage
    );

    return {
      formattedTxMsgs,
      formattedNotifications: formattedNotifications.map(
        ({ notification }) => notification
      )
    };
  };

  const formatDate = (timestamp) => {
    if (timestamp === "pending") {
      return "Pending";
    }
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  };

  const handleLink = (n) => {
    navigate(
      `/${n.transactionType === "Message" ? "notification" : "transaction"}/${
        n.node.id
      }`,
      {
        search: {
          back: "/notifications"
        }
      }
    );
  };

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("setting_notifications")} />
      <Wrapper>
        {loading && (
          <LoadingWrapper>
            <Loading style={{ width: "20px", height: "20px" }} />
          </LoadingWrapper>
        )}
        {empty && (
          <Empty>
            <TitleMessage>
              {browser.i18n.getMessage("no_notifications")}
            </TitleMessage>
            <TitleMessage>
              {browser.i18n.getMessage("no_notifications_get_started")}
            </TitleMessage>
          </Empty>
        )}
        {subscriptions.map((subscription) => (
          <NotificationItem showPaddingTop={true}>
            <Description>{"Subscription"}</Description>
            <TitleMessage>{`${subscription.applicationName} Awaiting Payment`}</TitleMessage>
            <Link
              onClick={() =>
                navigate(`/subscriptions/${subscription.arweaveAccountAddress}`)
              }
            >
              Pay Subscription
            </Link>
          </NotificationItem>
        ))}
        {!loading &&
          !empty &&
          notifications.map((notification, index) => (
            <NotificationWrapper key={notification.node.id}>
              <NotificationItem
                key={notification.node.id}
                onClick={() => handleLink(notification)}
                showPaddingTop={index !== 0}
              >
                <Description>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {notification.transactionType === "Message" ? (
                      <MessageDotsCircle height={19} width={19} />
                    ) : (
                      <Wallet02 height={19} width={19} />
                    )}
                    <div>
                      {notification.transactionType === "Message"
                        ? "Message"
                        : "Transaction"}
                    </div>
                    {!!notification.isAo && (
                      <Image src={aoLogo} alt="ao logo" />
                    )}
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    {formatDate(notification.node.block.timestamp)}
                  </div>
                </Description>
                <TitleMessage>{formattedTxMsgs[index]}</TitleMessage>
              </NotificationItem>
              {index !== notifications.length - 1 && (
                <HorizontalLine marginVertical={16} />
              )}
            </NotificationWrapper>
          ))}
      </Wrapper>
    </>
  );
}

export const Empty = styled.div`
  width: calc(100% - 30px);
  height: calc(100% - 64.59px);
  margin-top: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const LoadingWrapper = styled.div`
  position: absolute;
  width: calc(100% - 30px);
  height: calc(100% - 64.59px);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Link = styled.a`
  color: ${(props) => props.theme.primary};
  font-size: 12px;
  cursor: pointer;
`;

export const TitleMessage = styled(Text).attrs({
  size: "md",
  weight: "medium",
  noMargin: true
})``;

const Description = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 16px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
`;

export const NotificationItem = styled.div<{ showPaddingTop: boolean }>`
  width 100%;
  gap: 8px;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
`;

const NotificationWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Wrapper = styled.div`
  width: 100%;
  padding: 0px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;
