import { Loading } from "@arconnect/components";
import { FiatAmount, AmountTitle } from "~routes/popup/transaction/[id]";
import browser from "webextension-polyfill";
import { useMemo, useState } from "react";
import { formatAddress, PersistentStorage, useStorage, ExtensionStorage, formatFiatBalance, useSetting, fetchTokenByProcessId, type TokenInfo, useAsyncEffect, RawDataItem } from "@wanderapp/core";
import { Quantity } from "ao-tokens";
import prettyBytes from "pretty-bytes";
import { TransactionTag } from "./TransactionTag";
import { Box } from "../ui/atoms/box/Box";
import { TokenLogo } from "../../be/TokenLogo";
import { Spacer } from "../ui/atoms/spacer/Spacer";
import { Row } from "../ui/atoms/row/Row";
import { Text } from "../ui/atoms/text/Text";
import { ChevronRight } from "../icons";

export interface SignDataItemDetailsProps {
  dataItem: RawDataItem;
}

export function SignDataItemDetails({ dataItem }: SignDataItemDetailsProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState<Quantity | null>(null);
  const [showTags, setShowTags] = useState<boolean>(false);

  const recipient = dataItem?.tags?.find((tag) => tag.name === "Recipient")?.value || "";
  const quantity = dataItem?.tags?.find((tag) => tag.name === "Quantity")?.value || "0";
  const transfer = dataItem?.tags?.some((tag) => tag.name === "Action" && tag.value === "Transfer");
  const tokenName = tokenInfo?.Name;

  useAsyncEffect(async () => {
    // TODO: See if dataItem with no `target` property but a Target tag is valid, and update this code if needed.
    if (!dataItem.target || !transfer) return;

    let tokenInfo: TokenInfo;

    try {
      setLoading(true);

      tokenInfo = await fetchTokenByProcessId(dataItem.target);

      if (!tokenInfo) {
        throw new Error("Token not found");
      }
    } catch (err) {
      // fallback
      console.error("Error loading token info =", err);

      try {
        const [aoTokens = [], aoTokensCache = []] = await Promise.all([
          PersistentStorage.get<TokenInfo[]>("ao_tokens"),
          PersistentStorage.get<TokenInfo[]>("ao_tokens_cache"),
        ]);
        const aoTokensCombined = [...aoTokens, ...aoTokensCache];
        const token = aoTokensCombined.find(({ processId }) => dataItem.target === processId);

        if (token) {
          tokenInfo = token;
        }
      } catch {}
    } finally {
      if (tokenInfo) {
        const tokenAmount = new Quantity(BigInt(quantity), BigInt(tokenInfo.Denomination));
        setAmount(tokenAmount);
        setTokenInfo(tokenInfo);
      }

      setLoading(false);
    }
  }, [dataItem]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  // token price
  const [price, setPrice] = useState(0);

  // transaction price
  const fiatPrice = useMemo(() => +(amount || 0) * price, [amount, price]);

  const formattedAmount = useMemo(() => (amount || 0).toLocaleString(), [amount]);

  // active address
  const [activeAddress] = useStorage<string>(
    {
      key: "active_address",
      instance: ExtensionStorage,
    },
    "",
  );

  return dataItem ? (
    <Box style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "4px",
        }}>
        {loading ? (
          <Loading style={{ width: "16px", height: "16px" }} />
        ) : (
          tokenInfo && <TokenLogo token={tokenInfo || ""} />
        )}
      </div>
      {transfer && (
        <>
          <FiatAmount>{formatFiatBalance(fiatPrice, currency)}</FiatAmount>
          <AmountTitle
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "flex-end",
              marginBottom: "16px",
              color: "#666666",
            }}>
            {formattedAmount}
            <span style={{ lineHeight: "1.5em" }}>{tokenName}</span>
          </AmountTitle>
        </>
      )}

      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: 0,
          margin: 0,
          width: "100%",
        }}
        alignment="left"
        isAutoWidth>
        {dataItem?.target && (
          <TransactionTag name={browser.i18n.getMessage("process_id")} value={formatAddress(dataItem?.target, 6)} />
        )}
        <TransactionTag
          name={browser.i18n.getMessage("transaction_from")}
          value={formatAddress(activeAddress, 6)}
        />
        {recipient && (
          <TransactionTag name={browser.i18n.getMessage("transaction_to")} value={formatAddress(recipient, 6)} />
        )}

        <TransactionTag name={browser.i18n.getMessage("transaction_fee")} value={`0 AR`} />
        <TransactionTag
          name={browser.i18n.getMessage("transaction_size")}
          value={prettyBytes(dataItem?.data.length)}
        />
        <Spacer y={0.1} />
        <Row
          alignment="center"
          justifyContent="start"
          style={{ gap: "0.3rem", cursor: "pointer" }}
          onClick={() => setShowTags((prev) => !prev)}>
          <Text variant="bodySm" style={{ color: "#666666" }}>
            Tags
          </Text>
          <div
            style={{
              display: "inline-flex",
              transition: "transform 0.2s ease",
              transform: showTags ? "rotate(90deg)" : "rotate(0deg)",
            }}>
            <ChevronRight fontSize={24} color={"#666666"} />
          </div>
        </Row>
        <Spacer y={0.05} />
        {showTags && dataItem?.tags?.map((tag, i) => <TransactionTag key={i} name={tag.name} value={tag.value} />)}
      </Box>
    </Box>
  ) : (
    <Loading />
  );
}
