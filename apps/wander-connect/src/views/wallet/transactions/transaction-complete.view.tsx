import { CommonRouteProps, useLocation, useSearchParams, WanderRoutePath } from "@wanderapp/core";
import { Box, Card, XClose, Text, Button } from "@wanderapp/ui";
import browser from "webextension-polyfill";
import Lottie from "react-lottie";
import { EmbeddedPaths } from "../../../router/dashboard/iframe.routes";
import { postEmbeddedMessage } from "../../../utils/utils/messages/embedded-messages.utils";

import checkmarkAnimationData from "assets/lotties/checkmark.json";

export interface TransactionCompletedParams {
  id: string;
}

export type TransactionCompletedViewProps = CommonRouteProps<TransactionCompletedParams>;

export function WalletTransactionCompleteEmbeddedView({ params: { id } }: TransactionCompletedViewProps) {
  const { navigate } = useLocation();
  const { back: backPath, isAo } = useSearchParams<{
    back?: string;
    isAo: boolean;
  }>();

  const handleCancel = () => {
    postEmbeddedMessage({
      type: "embedded_close",
      data: null,
    });
    navigate(EmbeddedPaths.WalletHomeEmbeddedView);
  };

  if (!id) return null;

  return (
    <Card
      hasBackButton={false}
      customIcon={<XClose fontSize={24} color={"#666666"} />}
      onCloseButtonClick={handleCancel}
      style={{ padding: "2rem" }}>
      <Box>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: checkmarkAnimationData,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid slice",
            },
          }}
          height={200}
          width={200}
        />
        <Box style={{ gap: "1rem" }}>
          <Text variant="headingSm" style={{ textAlign: "center" }}>
            {browser.i18n.getMessage("transaction_complete")}
          </Text>

          <Button
            variant="link"
            onClick={() =>
              navigate(
                `/transaction/${id}?fromSend=true${
                  backPath ? `&back=${encodeURIComponent(backPath)}` : ""
                }` as WanderRoutePath,
              )
            }>
            See transaction details
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
