import { Row, Text, Box, Divider } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import Image from "~components/common/Image";
import { useEffect, useMemo, useState } from "react";
import Application, { type AppInfo } from "~applications/application";
import { defaultGateway, type Gateway } from "~gateways/gateway";
import Arweave from "arweave";
import BigNumber from "bignumber.js";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useBalance } from "~wallets/hooks";
import { formatBalance } from "~utils/format";
import { AlertTriangle } from "@untitled-ui/icons-react";
import TransactionMessage from "~components/embed/auth/TransactionMessage";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";

export function EmbeddedSignAuthRequestView() {
  const { navigate } = useLocation();
  const { authRequest, rejectRequest, acceptRequest } = useCurrentAuthRequest("sign");

  const { url = "", transaction } = authRequest;

  const [appInfo, setAppInfo] = useState<AppInfo & { gateway: Gateway }>();

  // quantity
  const quantity = useMemo(() => {
    if (!transaction?.quantity) {
      return BigNumber("0");
    }

    const arweave = new Arweave(defaultGateway);
    const ar = arweave.ar.winstonToAr(transaction.quantity);

    return BigNumber(ar);
  }, [transaction]);

  const { data: arBalance = "0" } = useBalance();

  const balance = useMemo(() => formatBalance(arBalance), [arBalance]);

  // transaction fee
  const fee = useMemo(() => {
    if (!transaction?.reward) return "0";

    const arweave = new Arweave(defaultGateway);
    return arweave.ar.winstonToAr(transaction.reward);
  }, [transaction]);

  const isTransferTx = useMemo(() => BigNumber(transaction?.quantity || "0").gt(0), [transaction]);

  useEffect(() => {
    (async () => {
      if (!url) return;

      const app = new Application(url);
      const gateway = await app.getGatewayConfig();
      const appData = await app.getAppData();

      setAppInfo({ ...appData, gateway });
    })();
  }, [url]);

  return (
    <AuthRequestCard
      headerText="Confirm Activity"
      onCancel={rejectRequest}
      onConfirm={acceptRequest}
      areButtonsDisabled={!transaction}>
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

      {isTransferTx ? (
        <>
          <Box hasBorder alignment="left" style={{ margin: "1rem", gap: "0.5rem" }}>
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Your account
            </Text>
            <Row isFullWidth justifyContent="between">
              <Text variant="bodyMd" style={{ color: "#666666" }}>
                Balance
              </Text>

              <Text variant="bodyMd" style={{ color: "#121212" }}>
                {balance.displayBalance} AR
              </Text>
            </Row>
          </Box>
          <Row isFullWidth justifyContent="between">
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Amount
            </Text>
            <Text variant="bodySm" style={{ color: "#121212" }}>
              {quantity.toString()} AR
            </Text>
          </Row>
          <Row isFullWidth justifyContent="between">
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Total fees
            </Text>
            <Text variant="bodySm" style={{ color: "#121212" }}>
              {fee} AR
            </Text>
          </Row>
          <Divider />
          <Row isFullWidth justifyContent="between">
            <Text variant="bodySm" style={{ color: "#666666" }}>
              Total
            </Text>
            <Text variant="bodySm" style={{ color: "#121212" }}>
              {quantity.plus(fee).toString()} AR
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
        transaction={transaction}
        detailsLink={ `/auth-request/sign/${ authRequest.authID}/details` } />
    </AuthRequestCard>
  );
}
