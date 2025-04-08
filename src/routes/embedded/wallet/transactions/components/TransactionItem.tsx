import { Row, Text, Box } from "~components/embed/ui";
import {
  getFormattedAmount,
  getFullMonthName,
  getTransactionDescription,
  type ExtendedTransaction
} from "~lib/transactions";
import browser from "webextension-polyfill";
import { useCallback, useEffect, useMemo, useState } from "react";
import arLogoLight from "url:/assets/ar/logo_light.png";
import { Logo } from "~components/popup/Token";
import { getArweaveLink } from "~gateways/utils";

interface TransactionItemProps {
  transaction: ExtendedTransaction;
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const [logoSource, setLogoSource] = useState<string>();

  useEffect(() => {
    const fetchLogo = async () => {
      if (transaction.aoInfo?.logo) {
        const logo = await getArweaveLink(transaction.aoInfo.logo);
        setLogoSource(logo!);
      } else {
        setLogoSource(arLogoLight);
      }
    };

    fetchLogo();
  }, [transaction.aoInfo?.logo]);

  const handleTransactionClick = useCallback(() => {
    const id = transaction.node.id;
    const url = transaction?.aoInfo
      ? `https://www.ao.link/#/message/${id}`
      : `https://viewblock.io/arweave/tx/${id}`;

    window.open(url, "_blank");
  }, [transaction]);

  const formattedDate = useMemo(() => {
    return transaction.date
      ? `${getFullMonthName(`${transaction.month}-${transaction.year}`)} ${
          transaction.day
        }`
      : browser.i18n.getMessage("pending");
  }, [transaction]);

  return (
    <Box
      hasBorder
      style={{ margin: "1rem 0", cursor: "pointer" }}
      onClick={handleTransactionClick}
    >
      <Row isFullWidth style={{ width: "100%", gap: "0px" }}>
        <Logo
          src={logoSource}
          alt={transaction.aoInfo?.tickerName}
          style={{ flexShrink: 0, width: "24px", height: "24px" }}
        />
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            display: "flex",
            gap: "0px"
          }}
        >
          <Row isFullWidth justifyContent="between" alignment="center">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "60%"
              }}
            >
              <Text
                variant="bodyMd"
                style={{
                  color: "#121212",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {getTransactionDescription(transaction)}
              </Text>
              <Text variant="bodySm">{formattedDate}</Text>
            </div>
            <Text
              variant="bodyMd"
              style={{
                color: "#121212",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {getFormattedAmount(transaction)}
            </Text>
          </Row>
        </Box>
      </Row>
    </Box>
  );
};

export default TransactionItem;
