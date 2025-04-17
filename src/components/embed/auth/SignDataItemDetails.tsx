import { Loading } from "@arconnect/components";
import { FiatAmount, AmountTitle } from "~routes/popup/transaction/[id]";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useState } from "react";
import { formatAddress } from "~utils/format";
import { PersistentStorage, useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { Quantity } from "ao-tokens";
import prettyBytes from "pretty-bytes";
import { formatFiatBalance } from "~tokens/currency";
import useSetting from "~settings/hook";
import { fetchTokenByProcessId, type TokenInfo } from "~tokens/aoTokens/ao";
import { getUserAvatar } from "~lib/avatar";
import { LogoWrapper, Logo } from "~components/popup/Token";
import arLogoLight from "url:/assets/ar/logo_light.png";
import { Box, ChevronRight, Spacer, Text, Row } from "../ui";
import TransactionTag from "./TransactionTag";

export default function SignDataItemDetails({ params }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenName, setTokenName] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [amount, setAmount] = useState<Quantity | null>(null);
  const [showTags, setShowTags] = useState<boolean>(false);

  const recipient =
    params?.tags?.find((tag) => tag.name === "Recipient")?.value || "";
  const quantity =
    params?.tags?.find((tag) => tag.name === "Quantity")?.value || "0";
  const transfer = params?.tags?.some(
    (tag) => tag.name === "Action" && tag.value === "Transfer"
  );

  const arweaveLogo = arLogoLight;

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!process || !transfer) return;

      let tokenInfo: TokenInfo;

      try {
        setLoading(true);
        tokenInfo = await fetchTokenByProcessId(params.target);
        if (!tokenInfo) {
          throw new Error("Token not found");
        }
      } catch (err) {
        // fallback
        console.log("err", err);

        try {
          const [aoTokens = [], aoTokensCache = []] = await Promise.all([
            PersistentStorage.get<TokenInfo[]>("ao_tokens"),
            PersistentStorage.get<TokenInfo[]>("ao_tokens_cache")
          ]);
          const aoTokensCombined = [...aoTokens, ...aoTokensCache];
          const token = aoTokensCombined.find(
            ({ processId }) => params.target === processId
          );
          if (token) {
            tokenInfo = token;
          }
        } catch {}
      } finally {
        if (tokenInfo) {
          if (tokenInfo?.Logo) {
            const logo = await getUserAvatar(tokenInfo?.Logo);
            setLogo(logo || "");
          } else {
            setLogo(arweaveLogo);
          }

          const tokenAmount = new Quantity(
            BigInt(quantity),
            BigInt(tokenInfo.Denomination)
          );
          setTokenName(tokenInfo.Name);
          setAmount(tokenAmount);
        }
        setLoading(false);
      }
    };
    fetchTokenInfo();
  }, [params]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  // token price
  const [price, setPrice] = useState(0);

  // transaction price
  const fiatPrice = useMemo(() => +(amount || 0) * price, [amount, price]);

  const process = params?.target;

  const formattedAmount = useMemo(
    () => (amount || 0).toLocaleString(),
    [amount]
  );

  // active address
  const [activeAddress] = useStorage<string>(
    {
      key: "active_address",
      instance: ExtensionStorage
    },
    ""
  );

  return (
    <>
      {params ? (
        <Box style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "4px"
            }}
          >
            {!loading ? (
              logo && <LogoWrapper img={logo} alt={`${tokenName} logo`} />
            ) : (
              <Loading style={{ width: "16px", height: "16px" }} />
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
                  color: "#666666"
                }}
              >
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
              width: "100%"
            }}
            alignment="left"
            isAutoWidth
          >
            {params?.target && (
              <TransactionTag
                name={browser.i18n.getMessage("process_id")}
                value={formatAddress(params?.target, 6)}
              />
            )}
            <TransactionTag
              name={browser.i18n.getMessage("transaction_from")}
              value={formatAddress(activeAddress, 6)}
            />
            {recipient && (
              <TransactionTag
                name={browser.i18n.getMessage("transaction_to")}
                value={formatAddress(recipient, 6)}
              />
            )}

            <TransactionTag
              name={browser.i18n.getMessage("transaction_fee")}
              value={`0 AR`}
            />
            <TransactionTag
              name={browser.i18n.getMessage("transaction_size")}
              value={prettyBytes(params?.data.length)}
            />
            <Spacer y={0.1} />
            <Row
              alignment="center"
              justifyContent="start"
              style={{ gap: "0.3rem", cursor: "pointer" }}
              onClick={() => setShowTags((prev) => !prev)}
            >
              <Text variant="bodySm" style={{ color: "#666666" }}>
                Tags
              </Text>
              <div
                style={{
                  display: "inline-flex",
                  transition: "transform 0.2s ease",
                  transform: showTags ? "rotate(90deg)" : "rotate(0deg)"
                }}
              >
                <ChevronRight fontSize={24} color={"#666666"} />
              </div>
            </Row>
            <Spacer y={0.05} />
            {showTags &&
              params?.tags?.map((tag, i) => (
                <TransactionTag key={i} name={tag.name} value={tag.value} />
              ))}
          </Box>
        </Box>
      ) : (
        <Loading />
      )}
    </>
  );
}
