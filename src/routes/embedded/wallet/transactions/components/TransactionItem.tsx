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
      <Row isFullWidth>
        <Logo src={logoSource} alt="" />
        <Box>
          <Row isFullWidth justifyContent="between">
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              {getTransactionDescription(transaction)}
            </Text>
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              {getFormattedAmount(transaction)}
            </Text>
          </Row>
          <Row isFullWidth justifyContent="between" alignment="center">
            <Text variant="bodySm">{formattedDate}</Text>
          </Row>
        </Box>
      </Row>
    </Box>
  );
};

export default TransactionItem;
