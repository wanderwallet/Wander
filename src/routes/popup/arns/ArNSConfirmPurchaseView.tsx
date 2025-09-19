import { Button, Text } from "@arconnect/components-rebrand";
import { useEffect, useMemo, useState } from "react";
import { Flex } from "~components/common/Flex";
import { ArioIcon } from "~components/embed";
import HeadV2 from "~components/popup/HeadV2";
import {
  ARIO_PROCESS_ID,
  ARNS_QUERY_CLIENT,
  purchaseArNSName,
  useIsArNSPurchaseGated,
  useRegistrationFee,
  useTicker,
} from "~lib/arns";
import { useActiveAddress } from "~wallets/hooks";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { RegisteringCard } from "./RegisteringCard";
import TransactionStatusModal from "./TransactionStatusModal";
import type { PurchaseType } from "./types";
import { decodeDomainToASCII, lowerCaseDomain } from "./utils";
import { queryClient } from "~utils/tanstack";
import browser from "webextension-polyfill";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { trackPage, PageType, trackEvent, EventType } from "~utils/analytics";
import { useTokenPrice } from "~tokens/hooks";
import useSetting from "~settings/hook";
import { formatFiatBalance } from "~tokens/currency";
import BigNumber from "bignumber.js";
import { useAoRateLimitedToast } from "~utils/toast/toast.hooks";

export interface ArNSConfirmPurchaseViewParams {
  name: string;
  purchaseType: PurchaseType;
  purchaseYears?: number;
}
export type ArNSConfirmPurchaseViewProps = CommonRouteProps<ArNSConfirmPurchaseViewParams>;

export const ArNSConfirmPurchaseView = ({
  params: { name, purchaseType, purchaseYears },
}: ArNSConfirmPurchaseViewProps) => {
  const { data: ticker } = useTicker();
  const isArnGated = useIsArNSPurchaseGated();

  const { showAoRateLimitedToast } = useAoRateLimitedToast();
  const { data: totalFee } = useRegistrationFee(name, purchaseType, purchaseYears);
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);

  const [currency = "USD"] = useSetting("currency");
  const { price = 0 } = useTokenPrice(ARIO_PROCESS_ID, currency);
  const fiatTotalFee = useMemo(() => BigNumber(totalFee || 0).times(price || 0), [totalFee, price]);

  const [transactionState, setTransactionState] = useState<string | undefined>();

  const activeAddress = useActiveAddress();

  const { navigate } = useLocation();

  const handleConfirmPurchase = async () => {
    try {
      setProcessingTransaction(true);
      setTransactionState(browser.i18n.getMessage("processing_transactions"));

      const safeDomain = lowerCaseDomain(name);

      const result = await purchaseArNSName({
        name: safeDomain,
        purchaseType,
        purchaseYears,
        transactionListener: (transactionState) => {
          log(LOG_GROUP.ARNS, "transaction state received: ", transactionState);
          setTransactionState(transactionState);
        },
      });

      await ARNS_QUERY_CLIENT.invalidateQueries({
        queryKey: ["arns-records-for-address", activeAddress],
      });
      await queryClient.invalidateQueries({ queryKey: ["tokenBalance", ARIO_PROCESS_ID, activeAddress] });

      trackEvent(EventType.ARNS_PURCHASE_SUCCESS, {
        name,
        purchaseType,
        purchaseYears,
      });

      navigate(`/arns/purchase-success/${name}/${purchaseType}/${purchaseYears}/${result.transactionId}`);
    } catch (error) {
      log(LOG_GROUP.ARNS, "error: ", error);

      trackEvent(EventType.ARNS_PURCHASE_ERROR, {
        name,
        purchaseType,
        purchaseYears,
      });

      showAoRateLimitedToast(error);

      navigate(`/arns/purchase-error/${name}/${purchaseType}/${purchaseYears}`);
    } finally {
      setProcessingTransaction(false);
      setTransactionState(undefined);
    }
  };

  useEffect(() => {
    trackPage(PageType.ARNS_PURCHASE_CONFIRM);
  }, []);

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title={browser.i18n.getMessage("confirm_transaction")} />
      <RegisteringCard
        style={{ margin: "0 1.5rem" }}
        name={decodeDomainToASCII(name)}
        purchaseType={purchaseType}
        purchaseYears={purchaseYears}
      />
      <Flex direction="column" style={{ margin: "1rem" }} justify="center" align="center" gap="0.5rem">
        <Flex justify="center" align="baseline" gap=".25rem">
          <Text size="2xl" weight="semibold" style={{ textAlign: "center" }}>
            {totalFee ?? "..."}
          </Text>
          <Text>{ticker}</Text>
          <ArioIcon width=".75rem" height=".75rem" />
        </Flex>
        {fiatTotalFee.gt(0) && (
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            {formatFiatBalance(fiatTotalFee, currency)}
          </Text>
        )}
      </Flex>
      <div style={{ flex: 1 }}></div>
      <div style={{ margin: "1.5rem" }}>
        <Button onClick={handleConfirmPurchase} fullWidth disabled={processingTransaction || !totalFee || isArnGated}>
          {browser.i18n.getMessage("confirm")}
        </Button>
      </div>
      {processingTransaction && (
        <TransactionStatusModal
          isOpen={processingTransaction}
          setOpen={setProcessingTransaction}
          statusText={transactionState}
        />
      )}
    </Flex>
  );
};
