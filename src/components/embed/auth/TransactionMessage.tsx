import type { SplitTransaction } from "~api/modules/sign/transaction_builder";
import { type Transaction } from "arbundles";
import { useState, useMemo, useCallback, useEffect } from "react";
import type { DecodedTag } from "~api/modules/sign/tags";
import { defaultGateway } from "~gateways/gateway";
import { Box, Text, Row, ChevronRight } from "../ui";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import type { RawDataItem } from "~api/modules/sign_data_item/types";

interface TransactionMessaageProps {
  transaction: SplitTransaction | Transaction | RawDataItem;
  showLink?: boolean;
}

export default function TransactionMessage({
  transaction,
  showLink = true
}: TransactionMessaageProps) {
  const { navigate } = useLocation();
  const [message, setMessage] = useState<string>("");

  // tags
  const tags = useMemo<DecodedTag[]>(() => {
    if (!transaction) return [];

    // @ts-expect-error
    if (transaction?.tags && !transaction?.get) return transaction.tags;

    // @ts-expect-error
    const tags = transaction.get("tags") as Tag[];
    const decodedTags = tags.map((tag) => ({
      name: tag.get("name", { decode: true, string: true }),
      value: tag.get("value", { decode: true, string: true })
    }));

    return decodedTags;
  }, [transaction]);

  // get content type
  const getContentType = useCallback(
    () =>
      // @ts-expect-error
      transaction?.data?.type ||
      tags?.find((t) => t.name.toLowerCase() === "content-type")?.value,
    [transaction, tags]
  );

  const isTextContent = useMemo(() => {
    const type = getContentType();

    if (!type) return false;

    return type.startsWith("text/") || type === "application/json";
  }, [getContentType]);

  useEffect(() => {
    const processTransactionData = async () => {
      if (!transaction?.data) return;

      const type = getContentType();
      if (!type) return;

      const arweave = new Arweave(defaultGateway);

      try {
        // if too large, show a message
        if (transaction.data.length > 1000000) {
          setMessage(browser.i18n.getMessage("data_too_large"));
          return;
        }

        // Only process text-based content
        if (isTextContent) {
          let txData = arweave.utils.bufferToString(
            transaction.data instanceof Uint8Array
              ? transaction.data
              : new Uint8Array(transaction.data)
          );

          if (type === "application/json") {
            try {
              txData = JSON.stringify(JSON.parse(txData), null, 2);
              setMessage(txData);
            } catch (jsonError) {
              console.log("Error parsing JSON:", jsonError);
            }
          } else if (type.startsWith("text/")) {
            setMessage(txData.trim());
          }
        } else {
          setMessage(
            browser.i18n.getMessage("data_content_type_not_supported", [type])
          );
        }
      } catch (error) {
        console.log("Error processing transaction data:", error);
      }
    };

    processTransactionData();
  }, [transaction, isTextContent]);

  if (!message && !showLink) return null;

  return (
    <Box hasBorder alignment="left" style={{ margin: "1rem" }}>
      {message && (
        <Box alignment="left" style={{ padding: 0, margin: 0 }}>
          <Text variant="bodySm" style={{ color: "#666666" }}>
            Message
          </Text>
          <Text variant="bodySm" style={{ color: "#121212" }}>
            {message}
          </Text>
        </Box>
      )}
      {showLink && (
        <Row
          isFullWidth
          justifyContent="between"
          style={{ marginTop: "0.5rem", cursor: "pointer" }}
          onClick={() => navigate("/wallet/transaction-details")}
        >
          <Text variant="bodySm" style={{ color: "#666666" }}>
            Transaction details
          </Text>
          <ChevronRight fontSize={24} color={"#121212"} />
        </Row>
      )}
    </Box>
  );
}
