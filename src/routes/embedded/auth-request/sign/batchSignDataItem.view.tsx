import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import SignDataItemDetails from "~components/embed/auth/SignDataItemDetails";
import { Quantity } from "ao-tokens";
import { timeoutPromise } from "~utils/promises/timeout";
import { Box, Text, Row } from "~components/embed/ui";
import { fetchTokenByProcessId } from "~tokens/aoTokens/ao";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";

export function EmbeddedBatchSignDataItemAuthRequestView() {
  const { authRequest, acceptRequest, rejectRequest } = useCurrentAuthRequest("batchSignDataItem");
  const { data, url } = authRequest;
  const [loading, setLoading] = useState<boolean>(false);
  const [transaction, setTransaction] = useState<any | null>(null);
  const [transactionList, setTransactionList] = useState<any | null>(null);

  useEffect(() => {
    const fetchTransactionList = async () => {
      setLoading(true);

      try {
        if (Array.isArray(data)) {
          const listItems = await Promise.all(
            data.map(async (item, index) => {
              let amount = "";
              let name = "";
              const quantity = item?.tags?.find((tag) => tag.name === "Quantity")?.value || "0";
              const transfer = item?.tags?.some((tag) => tag.name === "Action" && tag.value === "Transfer");

              if (transfer && quantity) {
                let tokenInfo: any;
                try {
                  tokenInfo = await timeoutPromise(fetchTokenByProcessId(item.target), 6000);
                  if (!tokenInfo) {
                    throw new Error("Token not found");
                  }
                  const tokenAmount = new Quantity(BigInt(quantity), BigInt(tokenInfo.Denomination));
                  amount = tokenAmount.toLocaleString();
                  name = tokenInfo.Name;
                } catch (error) {
                  console.error("Token fetch timed out or failed", error);
                  amount = quantity;
                  name = item.target;
                }
              }
              return (
                <Row
                  key={index}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    padding: 0,
                  }}
                  className="dropdown-item"
                  onClick={() => setTransaction(item)}
                  isFullWidth>
                  <Box alignment="left" style={{ padding: "0.5rem" }}>
                    <Text variant="bodyMd" style={{ color: "#666666" }}>
                      Transaction {index + 1}
                    </Text>
                    <Text variant="bodyXs">{formatTransactionDescription(amount, name)}</Text>
                  </Box>
                </Row>
              );
            }),
          );
          setTransactionList(listItems);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionList();
  }, [data]);

  return transaction ? (
    <AuthRequestCard
      headerText={browser.i18n.getMessage("batch_sign_items")}
      onBackButtonClick={() => setTransaction(null)}
      onCancel={() => setTransaction(null)}
      cancelLabel={browser.i18n.getMessage("back")}>
      <Box alignment="left" style={{ padding: "1rem 0" }}>
        <Text variant="bodyMd" style={{ color: "#666666" }}>
          {browser.i18n.getMessage("batch_sign_data_description", url)}
        </Text>

        <SignDataItemDetails params={transaction} />
      </Box>
    </AuthRequestCard>
  ) : (
    <AuthRequestCard
      headerText={browser.i18n.getMessage("batch_sign_items")}
      onCancel={() => rejectRequest()}
      onConfirm={() => acceptRequest()}
      confirmLabel={browser.i18n.getMessage("sign_authorize_all")}
      isDisabled={loading}>
      <Box alignment="left" style={{ padding: "1rem 0" }}>
        <Text variant="bodyMd" style={{ color: "#666666" }}>
          {browser.i18n.getMessage("batch_sign_data_description", url)}
        </Text>

        {transactionList}
      </Box>
    </AuthRequestCard>
  );
}

function formatTransactionDescription(amount?: string, tokenName?: string): string {
  if (amount && tokenName) {
    return `Sending ${amount} of ${tokenName}`;
  }
  return "Unknown transaction";
}
