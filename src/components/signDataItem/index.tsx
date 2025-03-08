import { Loading, Section, Spacer } from "@arconnect/components";
import {
  FiatAmount,
  AmountTitle,
  Properties,
  TransactionProperty,
  PropertyName,
  PropertyValue,
  TagValue
} from "~routes/popup/transaction/[id]";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatAddress } from "~utils/format";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { Quantity, Token } from "ao-tokens";
import prettyBytes from "pretty-bytes";
import { formatFiatBalance } from "~tokens/currency";
import useSetting from "~settings/hook";
import type { TokenInfo, TokenInfoWithProcessId } from "~tokens/aoTokens/ao";
import { ChevronUpIcon, ChevronDownIcon } from "@iconicicons/react";
import { getUserAvatar } from "~lib/avatar";
import { LogoWrapper, Logo } from "~components/popup/Token";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { useTheme } from "~utils/theme";

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

  const theme = useTheme();
  const arweaveLogo = useMemo(
    () => (theme === "dark" ? arLogoDark : arLogoLight),
    [theme]
  );

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!process || !transfer) return;

      let tokenInfo: TokenInfo;

      try {
        setLoading(true);
        const token = await Token(params.target);
        tokenInfo = {
          ...token.info,
          Denomination: Number(token.info.Denomination)
        };
      } catch (err) {
        // fallback
        console.log("err", err);

        try {
          const aoTokens =
            (await ExtensionStorage.get<TokenInfoWithProcessId[]>(
              "ao_tokens"
            )) || [];
          const aoTokensCache =
            (await ExtensionStorage.get<TokenInfoWithProcessId[]>(
              "ao_tokens_cache"
            )) || [];
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
  const fiatPrice = useMemo(() => +(amount || 0) * price, [amount]);

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

  // adjust amount title font sizes
  const parentRef = useRef(null);
  const childRef = useRef(null);

  return (
    <>
      {params ? (
        <Section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "4px"
            }}
          >
            {!loading ? (
              logo && (
                <LogoWrapper>
                  <Logo src={logo} alt={`${tokenName} logo`} />
                </LogoWrapper>
              )
            ) : (
              <Loading style={{ width: "16px", height: "16px" }} />
            )}
          </div>
          {transfer && (
            <>
              <FiatAmount>{formatFiatBalance(fiatPrice, currency)}</FiatAmount>
              <AmountTitle
                ref={childRef}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "flex-end",
                  marginBottom: "16px"
                }}
              >
                {formattedAmount}
                <span style={{ lineHeight: "1.5em" }}>{tokenName}</span>
              </AmountTitle>
            </>
          )}

          <Properties>
            {params?.target && (
              <TransactionProperty>
                <PropertyName>
                  {browser.i18n.getMessage("process_id")}
                </PropertyName>
                <PropertyValue>
                  {formatAddress(params?.target, 6)}
                </PropertyValue>
              </TransactionProperty>
            )}
            <TransactionProperty>
              <PropertyName>
                {browser.i18n.getMessage("transaction_from")}
              </PropertyName>
              <PropertyValue>{formatAddress(activeAddress, 6)}</PropertyValue>
            </TransactionProperty>
            {recipient && (
              <TransactionProperty>
                <PropertyName>
                  {browser.i18n.getMessage("transaction_to")}
                </PropertyName>
                <PropertyValue>{formatAddress(recipient, 6)}</PropertyValue>
              </TransactionProperty>
            )}

            <TransactionProperty>
              <PropertyName>
                {browser.i18n.getMessage("transaction_fee")}
              </PropertyName>
              <PropertyValue>0 AR</PropertyValue>
            </TransactionProperty>
            <TransactionProperty>
              <PropertyName>
                {browser.i18n.getMessage("transaction_size")}
              </PropertyName>
              <PropertyValue>{prettyBytes(params?.data.length)}</PropertyValue>
            </TransactionProperty>
            <Spacer y={0.1} />
            <PropertyName
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
              onClick={() => setShowTags(!showTags)}
            >
              {browser.i18n.getMessage("transaction_tags")}
              {showTags ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </PropertyName>
            {console.log(params)}
            <Spacer y={0.05} />
            {showTags &&
              params?.tags?.map((tag, i) => (
                <TransactionProperty key={i}>
                  <PropertyName>{tag.name}</PropertyName>
                  <TagValue>{tag.value}</TagValue>
                </TransactionProperty>
              ))}
          </Properties>
        </Section>
      ) : (
        <Loading />
      )}
    </>
  );
}
