import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import type {
  WanderRoutePath,
  CommonRouteProps
} from "~wallets/router/router.types";
import Lottie from "react-lottie";
import checkmarkAnimationData from "assets/lotties/checkmark.json";
import { Box, Card, XClose, Text, Button } from "~components/embed/ui";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";

export interface TransactionCompletedParams {
  id: string;
}

export type TransactionCompletedViewProps =
  CommonRouteProps<TransactionCompletedParams>;

export function WalletTransactionCompleteEmbeddedView({
  params: { id }
}: TransactionCompletedViewProps) {
  const { navigate } = useLocation();
  const { back: backPath, isAo } = useSearchParams<{
    back?: string;
    isAo: boolean;
  }>();

  const handleCancel = () => {
    postEmbeddedMessage({
      type: "embedded_close",
      data: null
    });
    navigate("/wallet");
  };

  if (!id) return null;

  return (
    <Card
      size="auto"
      hasBackButton={false}
      customIcon={<XClose fontSize={24} color={"#666666"} />}
      onCloseButtonClick={handleCancel}
      style={{ padding: "2rem" }}
    >
      <Box>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: checkmarkAnimationData,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid slice"
            }
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
                }` as WanderRoutePath
              )
            }
          >
            See transaction details
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
