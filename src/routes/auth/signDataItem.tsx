import { Input, Loading, Section, Spacer, Text, useInput, useToasts } from "@arconnect/components-rebrand";
import {
  FiatAmount,
  AmountTitle,
  Properties,
  TransactionProperty,
  PropertyName,
  PropertyValue,
  TagValue,
  useAdjustAmountTitleWidth,
} from "~routes/popup/transaction/[id]";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { formatAddress } from "~utils/format";
import { PersistentStorage, useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { checkPassword } from "~wallets/auth";
import { Quantity, Token } from "ao-tokens";
import prettyBytes from "pretty-bytes";
import { formatFiatBalance } from "~tokens/currency";
import useSetting from "~settings/hook";
import { getPrice } from "~lib/coingecko";
import { getTagValue, type TokenInfo, type TokenInfoWithProcessId } from "~tokens/aoTokens/ao";
import { ChevronRightIcon } from "@iconicicons/react";
import { getUserAvatar } from "~lib/avatar";
import { LogoWrapper, Logo, WarningIcon } from "~components/popup/Token";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { useTheme } from "~utils/theme";
import { checkWalletBits, type WalletBitsCheck } from "~utils/analytics";
import { Degraded, WarningWrapper } from "~routes/popup/send";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";
import { useAskPassword } from "~wallets/hooks";
import { humanizeTimestampTags } from "~utils/timestamp";

export function SignDataItemAuthRequestView() {
  const { authRequest, acceptRequest, rejectRequest } = useCurrentAuthRequest("signDataItem");

  const { authID, data, url } = authRequest;

  const [loading, setLoading] = useState<boolean>(false);
  const [tokenName, setTokenName] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [amount, setAmount] = useState<Quantity | null>(null);
  const [showTags, setShowTags] = useState<boolean>(false);
  const [mismatch, setMismatch] = useState<boolean>(false);
  const { setToast } = useToasts();
  const askPassword = useAskPassword();

  const tags = useMemo(() => humanizeTimestampTags(data?.tags || []), [data]);
  const recipient = useMemo(() => getTagValue("Recipient", tags) || "", [tags]);
  const quantity = useMemo(() => getTagValue("Quantity", tags) || "0", [tags]);
  const transfer = useMemo(() => tags.some((tag) => tag.name === "Action" && tag.value === "Transfer"), [tags]);

  const [transferRequirePassword] = useStorage<boolean>(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage,
    },
    false,
  );

  const process = data?.target;

  const formattedAmount = useMemo(() => (amount || 0).toLocaleString(), [amount]);

  // adjust amount title font sizes
  const parentRef = useRef(null);
  const childRef = useRef(null);
  useAdjustAmountTitleWidth(parentRef, childRef, formattedAmount);

  // active address
  const [activeAddress] = useStorage<string>(
    {
      key: "active_address",
      instance: ExtensionStorage,
    },
    "",
  );

  const theme = useTheme();

  const arweaveLogo = useMemo(() => (theme === "dark" ? arLogoDark : arLogoLight), [theme]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  // token price
  const [price, setPrice] = useState(0);

  // transaction price
  const fiatPrice = useMemo(() => +(amount || 0) * price, [amount]);

  const passwordInput = useInput();

  const headerTitle = useMemo(() => {
    if (!tags?.length) return browser.i18n.getMessage("sign_item");

    const actionValue = getTagValue("Action", tags);
    const isAOTransaction = tags.some((tag) => tag.name === "Data-Protocol" && tag.value === "ao");

    if (isAOTransaction && actionValue) {
      return actionValue.replace(/-/g, " ");
    }

    return browser.i18n.getMessage("sign_item");
  }, [tags]);

  // sign message
  async function sign() {
    if (transferRequirePassword && askPassword) {
      const checkPw = await checkPassword(passwordInput.state);
      if (!checkPw) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400,
        });
        return;
      }
    }

    await acceptRequest();
  }

  useEffect(() => {
    if (!tokenName) return;
    getPrice(tokenName, currency)
      .then((res) => setPrice(res))
      .catch();
  }, [currency, tokenName]);

  // get ao token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!process || !transfer) return;
      let tokenInfo: TokenInfo;
      try {
        setLoading(true);
        const token = await Token(data.target);
        tokenInfo = {
          ...token.info,
          Denomination: Number(token.info.Denomination),
        };
      } catch (err) {
        // fallback
        console.log("err", err);
        try {
          const aoTokens = (await PersistentStorage.get<TokenInfoWithProcessId[]>("ao_tokens")) || [];
          const aoTokensCache = (await PersistentStorage.get<TokenInfoWithProcessId[]>("ao_tokens_cache")) || [];
          const aoTokensCombined = [...aoTokens, ...aoTokensCache];
          const token = aoTokensCombined.find(({ processId }) => data.target === processId);
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

          const tokenAmount = new Quantity(BigInt(quantity), BigInt(tokenInfo.Denomination));
          setTokenName(tokenInfo.Name);
          setAmount(tokenAmount);
        }
        setLoading(false);
      }
    };
    fetchTokenInfo();
  }, [data]);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (transferRequirePassword && askPassword) return;
      if (e.key !== "Enter") return;
      await sign();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [authID, transferRequirePassword, askPassword]);

  useEffect(() => {
    if (tokenName && !logo) {
      setLogo(arweaveLogo);
    }
  }, [tokenName, logo, theme]);

  // check for if bits check exists, if it does, check mismatch
  useEffect(() => {
    const walletCheck = async () => {
      if (!activeAddress) {
        setMismatch(false);
        return;
      }
      try {
        const storageKey = `bits_check_${activeAddress}`;
        const storedCheck = await ExtensionStorage.get<WalletBitsCheck | boolean>(storageKey);

        if (typeof storedCheck !== "object") {
          const bits = await checkWalletBits();
          if (bits !== null) {
            setMismatch(bits);
          }
        } else {
          setMismatch(storedCheck.mismatch);
        }
      } catch (error) {
        console.error("Error checking wallet bits:", error);
      }
    };
    walletCheck();
  }, [activeAddress]);

  return (
    <Wrapper ref={parentRef}>
      <div>
        <HeadAuth title={headerTitle} />
        {mismatch && transfer && (
          <Degraded>
            <WarningWrapper>
              <WarningIcon color={theme === "dark" ? "#fff" : "#000"} />{" "}
            </WarningWrapper>
            <div>
              <h4>{browser.i18n.getMessage("mismatch_warning_title")}</h4>
              <span>
                <h4>{browser.i18n.getMessage("mismatch_warning")}</h4>

                {/* <a>Read more</a> */}
              </span>
            </div>
          </Degraded>
        )}
        <Description>
          <Text noMargin>{browser.i18n.getMessage("sign_data_description", url)}</Text>
        </Description>
        <Section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "4px",
            }}>
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
              {+fiatPrice > 0 && <FiatAmount>{formatFiatBalance(fiatPrice, currency)}</FiatAmount>}
              <AmountTitle
                ref={childRef}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "flex-end",
                  marginBottom: "16px",
                }}>
                {formattedAmount}
                <span style={{ lineHeight: "1.5em" }}>{tokenName}</span>
              </AmountTitle>
            </>
          )}

          <Properties>
            {data?.target && (
              <TransactionProperty>
                <PropertyName>{browser.i18n.getMessage("process_id")}</PropertyName>
                <PropertyValue>{formatAddress(data.target, 6)}</PropertyValue>
              </TransactionProperty>
            )}
            <TransactionProperty>
              <PropertyName>{browser.i18n.getMessage("transaction_from")}</PropertyName>
              <PropertyValue>{formatAddress(activeAddress, 6)}</PropertyValue>
            </TransactionProperty>
            {recipient && (
              <TransactionProperty>
                <PropertyName>{browser.i18n.getMessage("transaction_to")}</PropertyName>
                <PropertyValue>{formatAddress(recipient, 6)}</PropertyValue>
              </TransactionProperty>
            )}

            <TransactionProperty>
              <PropertyName>{browser.i18n.getMessage("transaction_fee")}</PropertyName>
              <PropertyValue>0 AR</PropertyValue>
            </TransactionProperty>
            <TransactionProperty>
              <PropertyName>{browser.i18n.getMessage("transaction_size")}</PropertyName>
              <PropertyValue>{prettyBytes(data.data.length)}</PropertyValue>
            </TransactionProperty>
            <Spacer y={0.1} />
            <PropertyName
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => setShowTags(!showTags)}>
              {browser.i18n.getMessage("transaction_tags")}
              <AnimatedChevron $open={showTags}>
                <ChevronRightIcon />
              </AnimatedChevron>
            </PropertyName>
            <Spacer y={0.05} />
            {showTags &&
              data?.tags?.map((tag, i) => (
                <TransactionProperty key={i}>
                  <PropertyName>{tag.name}</PropertyName>
                  <TagValue>{tag.value}</TagValue>
                </TransactionProperty>
              ))}
          </Properties>
        </Section>
      </div>
      <Section>
        {transferRequirePassword && askPassword && (
          <>
            <PasswordWrapper>
              <Input
                placeholder="Enter your password"
                sizeVariant="small"
                {...passwordInput.bindings}
                label={"Password"}
                type="password"
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  await sign();
                }}
                fullWidth
              />
            </PasswordWrapper>
            <Spacer y={1} />
          </>
        )}

        <AuthButtons
          authRequest={authRequest}
          primaryButtonProps={{
            label: browser.i18n.getMessage("signature_authorize"),
            onClick: sign,
          }}
          secondaryButtonProps={{
            onClick: () => rejectRequest(),
          }}
        />
      </Section>
    </Wrapper>
  );
}

const Description = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const PasswordWrapper = styled.div`
  display: flex;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;

export const AnimatedChevron = styled.div<{ $open: boolean }>`
  display: inline-flex;
  transition: transform 0.2s ease;
  transform: rotate(${(props) => (props.$open ? "90deg" : "0deg")});
`;
