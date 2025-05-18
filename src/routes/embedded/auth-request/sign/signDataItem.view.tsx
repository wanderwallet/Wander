import { Row, Text, Box, Divider } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import Image from "~components/common/Image";
import { useEffect, useMemo, useState } from "react";
import Application, { type AppInfo } from "~applications/application";
import { type Gateway } from "~gateways/gateway";
import { AlertTriangle } from "@untitled-ui/icons-react";
import { Quantity } from "ao-tokens";
import { getUserAvatar } from "~lib/avatar";
import { fetchTokenByProcessId, getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import { ExtensionStorage, PersistentStorage, useStorage } from "~utils/storage";
import { humanizeTimestampTags } from "~utils/timestamp";
import arLogoLight from "url:/assets/ar/logo_light.png";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useTokenBalance } from "~tokens/hooks";
import { Loading } from "@arconnect/components-rebrand";
import TransactionMessage from "~components/embed/auth/TransactionMessage";
import { formatBalance } from "~utils/format";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";

export function EmbeddedSignDataAuthRequestView() {
  const { authRequest, rejectRequest, acceptRequest } = useCurrentAuthRequest("signDataItem");
  const { url = "", data } = authRequest;

  const [appInfo, setAppInfo] = useState<AppInfo & { gateway: Gateway }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenName, setTokenName] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [amount, setAmount] = useState<Quantity | null>(null);
  const [denomination, setDenomination] = useState<number>(null);

  // active address
  const [activeAddress] = useStorage<string>(
    {
      key: "active_address",
      instance: ExtensionStorage,
    },
    "",
  );

  const tags = useMemo(() => humanizeTimestampTags(data?.tags || []), [data]);
  const quantity = useMemo(() => getTagValue("Quantity", tags) || "0", [tags]);
  const transfer = useMemo(() => tags.some((tag) => tag.name === "Action" && tag.value === "Transfer"), [tags]);
  const process = data?.target;

  const tokenInfo = useMemo(
    () => ({
      processId: process,
      Denomination: denomination,
    }),
    [process, denomination],
  );

  const { data: balance = "0", isLoading: balanceLoading } = useTokenBalance(tokenInfo, activeAddress);

  const formattedBalance = useMemo(() => {
    return formatBalance(balance).displayBalance;
  }, [balance]);

  const formattedAmount = useMemo(() => (amount || 0).toLocaleString(), [amount]);

  const arweaveLogo = arLogoLight;

  useEffect(() => {
    (async () => {
      if (!url) return;

      const app = new Application(url);
      const gateway = await app.getGatewayConfig();
      const appData = await app.getAppData();

      setAppInfo({ ...appData, gateway });
    })();
  }, [url]);

  // get ao token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!process || !transfer) return;
      let tokenInfo: TokenInfo;
      try {
        setLoading(true);
        tokenInfo = await fetchTokenByProcessId(data.target);
        if (!tokenInfo) throw new Error("Token not found");
      } catch (err) {
        // fallback
        console.log("err", err);
        try {
          const [aoTokens = [], aoTokensCache = []] = await Promise.all([
            PersistentStorage.get<TokenInfo[]>("ao_tokens"),
            PersistentStorage.get<TokenInfo[]>("ao_tokens_cache"),
          ]);
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
          setDenomination(tokenInfo.Denomination);
        }
        setLoading(false);
      }
    };
    fetchTokenInfo();
  }, [data]);

  useEffect(() => {
    if (tokenName && !logo) {
      setLogo(arweaveLogo);
    }
  }, [tokenName, logo]);

  return (
    <AuthRequestCard
      headerText="Confirm Activity"
      onCancel={rejectRequest}
      onConfirm={acceptRequest}
      areButtonsDisabled={loading}>
      <Box alignment="left" style={{ padding: "1rem 0" }}>
        <Row alignment="center" justifyContent="center" style={{ padding: 0 }}>
          <Image
            height={48}
            width={48}
            borderRadius={10}
            objectFit="contain"
            style={{ border: "1px solid #D6D6DD", flexShrink: 0 }}
            src={appInfo?.logo}
          />
          <Box alignment="left" style={{ padding: 0 }}>
            <Text variant="headingSm" style={{ color: "#666666" }}>
              {appInfo?.name}
            </Text>
            <Text variant="bodySm">Gateway: {appInfo?.gateway?.host}</Text>
          </Box>
        </Row>
      </Box>

      {transfer ? (
        <>
          <Box hasBorder alignment="left" style={{ margin: "1rem", gap: "0.5rem" }}>
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Your account
            </Text>
            <Row isFullWidth justifyContent="between">
              <Text variant="bodyMd" style={{ color: "#666666" }}>
                Balance
              </Text>

              {balanceLoading ? (
                <Loading style={{ width: 16, height: 16, color: "#666666" }} />
              ) : (
                <Text variant="bodyMd" style={{ color: "#121212" }}>
                  {formattedBalance} {tokenName}
                </Text>
              )}
            </Row>
          </Box>
          <Row isFullWidth justifyContent="between">
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Amount
            </Text>
            {loading ? (
              <Loading style={{ width: 16, height: 16, color: "#666666" }} />
            ) : (
              <Text variant="bodySm" style={{ color: "#121212" }}>
                {formattedAmount} {tokenName}
              </Text>
            )}
          </Row>
          <Row isFullWidth justifyContent="between">
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Total fees
            </Text>
            <Text variant="bodySm" style={{ color: "#121212" }}>
              0 AR
            </Text>
          </Row>
          <Divider />
          <Row isFullWidth justifyContent="between">
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Total
            </Text>
            <Text variant="bodySm" style={{ color: "#121212" }}>
              {formattedAmount} {tokenName}
            </Text>
          </Row>
        </>
      ) : (
        <Row style={{ padding: 12, backgroundColor: "#FFF9EA" }}>
          <AlertTriangle height={24} width={24} color="#BD8802" style={{ flexShrink: 0 }} />
          <Text variant="bodyXs" style={{ color: "#666666" }}>
            Only confirm if you understand the content and trust the requesting site. This confirmation is used for
            authentication purposes, funds are not being transferred.
          </Text>
        </Row>
      )}

      <TransactionMessage
        transaction={data}
        detailsLink={ `/auth-request/signDataItem/${ authRequest.authID}/details` }  />
    </AuthRequestCard>
  );
}
