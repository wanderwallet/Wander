import { Row, Text, Box } from "~components/embed/ui";
import {
  getFormattedAmount,
  getMonthName,
  getTransactionDescription,
  type ExtendedTransaction,
} from "~lib/transactions";
import browser from "webextension-polyfill";
import { useCallback, useMemo } from "react";
import { TokenLogo } from "~components/popup/TokenLogo";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import { AO_LINK_URL } from "~constants/urls";

interface TransactionItemProps {
  transaction: ExtendedTransaction;
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const tokenInfo = useMemo(() => {
    const { aoInfo } = transaction;

    return aoInfo
      ? ({
          processId: "",
          Denomination: aoInfo.denomination,
          Logo: aoInfo.logo,
          Ticker: aoInfo.tickerName,
        } satisfies TokenInfo)
      : "AR";
  }, [transaction]);

  const handleTransactionClick = useCallback(() => {
    const id = transaction.node.id;
    const url = transaction?.aoInfo ? `${AO_LINK_URL}/#/message/${id}` : `https://viewblock.io/arweave/tx/${id}`;

    window.open(url, "_blank");
  }, [transaction]);

  const formattedDate = useMemo(() => {
    return transaction.date
      ? `${getMonthName(`${transaction.month}-${transaction.year}`)} ${transaction.day}`
      : browser.i18n.getMessage("pending");
  }, [transaction]);

  return (
    <Box hasBorder style={{ cursor: "pointer" }} onClick={handleTransactionClick}>
      <Row isFullWidth style={{ width: "100%" }}>
        <TokenLogo token={tokenInfo} size={24} />
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            display: "flex",
            gap: "0px",
            padding: "0px",
          }}>
          <Row isFullWidth justifyContent="between" alignment="center">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "60%",
              }}>
              <Text
                variant="bodyMd"
                style={{
                  color: "#121212",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {getTransactionDescription(transaction)}
              </Text>
              <Text variant="bodySm">{formattedDate}</Text>
            </div>
            <Text
              variant="bodyMd"
              style={{
                color: "#121212",
                textOverflow: "ellipsis",
                overflowWrap: "break-word",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}>
              {getFormattedAmount(transaction)}
            </Text>
          </Row>
        </Box>
      </Row>
    </Box>
  );
};

export default TransactionItem;
