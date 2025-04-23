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
import type { ConTxDetailsRoutePath } from "~wallets/router/auth/auth.embed.routes";

interface TransactionMessageProps {
  transaction: SplitTransaction | Transaction | RawDataItem;
  txDetailsPath?: ConTxDetailsRoutePath;
}

export default function TransactionMessage({
  transaction,
  txDetailsPath
}: TransactionMessageProps) {
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

  useEffect(() => {
    const processTransactionData = async () => {
      if (!transaction?.data) return;

      try {
        // if too large, show a message
        if (transaction.data.length > 1000000) {
          setMessage(browser.i18n.getMessage("data_too_large"));
          return;
        }

        const type = getContentType();
        const arweave = new Arweave(defaultGateway);

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
            setMessage(txData.trim());
          }
        } else if (type?.startsWith("text/") || !type) {
          // Simple heuristic to detect if content is binary
          // Sample only the first 100 characters for performance
          const sampleSize = Math.min(100, txData.length);
          const sample = txData.substring(0, sampleSize);
          const nonPrintableChars = sample.match(
            /[\x00-\x08\x0B\x0C\x0E-\x1F]/g
          );
          const isProbablyText =
            !nonPrintableChars || nonPrintableChars.length / sampleSize < 0.05;

          if (isProbablyText) {
            setMessage(txData.trim());
          } else {
            setMessage(
              browser.i18n.getMessage("data_content_type_not_supported", [
                type || "binary"
              ])
            );
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
  }, [transaction, getContentType]);

  if (!message && !txDetailsPath) return null;

  return (
    <Box hasBorder alignment="left" style={{ margin: "1rem" }}>
      {message && (
        <Box alignment="left" style={{ padding: 0, margin: 0 }}>
          <Text variant="bodySm" style={{ color: "#666666" }}>
            Message
          </Text>
          <Box
            alignment="left"
            style={{
              maxHeight: "100px",
              overflowY: "auto",
              padding: 0,
              margin: 0
            }}
          >
            <Text variant="bodySm" style={{ color: "#121212" }}>
              {message}
            </Text>
          </Box>
        </Box>
      )}

      {txDetailsPath && (
        <Row
          isFullWidth
          justifyContent="between"
          style={{ marginTop: "0.5rem", cursor: "pointer" }}
          onClick={() => navigate(txDetailsPath)}
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
