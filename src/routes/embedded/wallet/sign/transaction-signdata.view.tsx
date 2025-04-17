import {
  Card,
  Row,
  Text,
  Box,
  Button,
  Divider,
  ChevronRight,
  XClose
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import Image from "~components/common/Image";
import { useEffect, useMemo, useState } from "react";
import Application, { type AppInfo } from "~applications/application";
import { type Gateway } from "~gateways/gateway";
import { AlertTriangle } from "@untitled-ui/icons-react";
import { Quantity } from "ao-tokens";
import { getUserAvatar } from "~lib/avatar";
import {
  fetchTokenByProcessId,
  getTagValue,
  type TokenInfo
} from "~tokens/aoTokens/ao";
import {
  ExtensionStorage,
  PersistentStorage,
  useStorage
} from "~utils/storage";
import { humanizeTimestampTags } from "~utils/timestamp";
import arLogoLight from "url:/assets/ar/logo_light.png";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useTokenBalance } from "~tokens/hooks";
import { Loading } from "@arconnect/components-rebrand";

export function EmbeddedSignDataAuthRequestView() {
  const { navigate } = useLocation();
  const { authRequest, rejectRequest, acceptRequest } =
    useCurrentAuthRequest("signDataItem");
  const { url = "", data, authID } = authRequest;

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
      instance: ExtensionStorage
    },
    ""
  );

  const tags = useMemo(() => humanizeTimestampTags(data?.tags || []), [data]);
  const quantity = useMemo(() => getTagValue("Quantity", tags) || "0", [tags]);
  const transfer = useMemo(
    () => tags.some((tag) => tag.name === "Action" && tag.value === "Transfer"),
    [tags]
  );
  const process = data?.target;

  const tokenInfo = useMemo(
    () => ({
      processId: process,
      Denomination: denomination
    }),
    [process, denomination]
  );

  const { data: balance = "0", isLoading: balanceLoading } = useTokenBalance(
    tokenInfo,
    activeAddress
  );

  const formattedAmount = useMemo(
    () => (amount || 0).toLocaleString(),
    [amount]
  );

  const arweaveLogo = arLogoLight;

  // sign message
  async function sign() {
    postEmbeddedMessage({
      type: "embedded_close",
      data: null
    });
    navigate("/wallet");
    await acceptRequest();
  }

  // current message
  const message = useMemo(() => {
    if (typeof data?.data === "undefined") return "";
    const messageBytes = new Uint8Array(data.data);

    return new TextDecoder().decode(messageBytes);
  }, [data]);

  const handleCancel = () => {
    postEmbeddedMessage({
      type: "embedded_close",
      data: null
    });
    navigate("/wallet");
    rejectRequest();
  };

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
            PersistentStorage.get<TokenInfo[]>("ao_tokens_cache")
          ]);
          const aoTokensCombined = [...aoTokens, ...aoTokensCache];
          const token = aoTokensCombined.find(
            ({ processId }) => data.target === processId
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
          setDenomination(tokenInfo.Denomination);
        }
        setLoading(false);
      }
    };
    fetchTokenInfo();
  }, [data]);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await sign();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [authID]);

  useEffect(() => {
    if (tokenName && !logo) {
      setLogo(arweaveLogo);
    }
  }, [tokenName, logo]);

  return (
    <Card
      size="auto"
      headerText="Confirm Activity"
      hasBackButton={false}
      customIcon={<XClose fontSize={24} color={"#666666"} />}
      onCloseButtonClick={handleCancel}
      style={{ padding: "2rem" }}
    >
      <Box alignment="left" style={{ padding: "1rem 0" }}>
        <Row alignment="center" justifyContent="center" style={{ padding: 0 }}>
          <Image
            height={48}
            width={48}
            borderRadius={10}
            objectFit="contain"
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
          <Box
            hasBorder
            alignment="left"
            style={{ margin: "1rem", gap: "0.5rem" }}
          >
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Your account
            </Text>
            <Row isFullWidth justifyContent="between">
              <Text variant="bodyMd" style={{ color: "#666666" }}>
                Balance
              </Text>

              {balanceLoading ? (
                <Loading style={{ width: 24, height: 24 }} />
              ) : (
                <Text variant="bodyMd" style={{ color: "#121212" }}>
                  {balance} {tokenName}
                </Text>
              )}
            </Row>
          </Box>
          <Row isFullWidth justifyContent="between">
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Amount
            </Text>
            <Text variant="bodySm" style={{ color: "#121212" }}>
              {formattedAmount} {tokenName}
            </Text>
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
          <AlertTriangle
            height={24}
            width={24}
            color="#BD8802"
            style={{ flexShrink: 0 }}
          />
          <Text variant="bodyXs" style={{ color: "#666666" }}>
            Only confirm if you understand the content and trust the requesting
            site. This confirmation is used for authentication purposes, funds
            are not being transferred.
          </Text>
        </Row>
      )}

      <Box hasBorder alignment="left" style={{ margin: "1rem" }}>
        {message && (
          <>
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Message
            </Text>
            <Text variant="bodySm" style={{ color: "#121212" }}>
              {message}
            </Text>
          </>
        )}
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
      </Box>
      <Row>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={sign} isDisabled={loading}>
          Confirm
        </Button>
      </Row>
    </Card>
  );
}
