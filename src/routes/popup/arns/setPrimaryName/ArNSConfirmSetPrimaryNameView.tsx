import { Button, Text } from "@arconnect/components-rebrand";
import { useEffect, useMemo, useState } from "react";
import { Flex } from "~components/common/Flex";
import HeadV2 from "~components/popup/HeadV2";
import {
  ARIO_PROCESS_ID,
  ARNS_QUERY_CLIENT,
  setPrimaryName,
  useArioBalance,
  usePrimaryNameCostDetails,
  useTicker,
} from "~lib/arns";
import { NAME_SERVICE_QUERY_CLIENT } from "~lib/nameservice";
import { useActiveWallet } from "~wallets/hooks";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { CardContainer } from "../CardContainer";
import TransactionStatusModal from "../TransactionStatusModal";
import { sleep } from "~utils/promises/sleep";
import { decodeDomainToASCII, formatArio } from "../utils";
import { mARIOToken } from "@ar.io/sdk/web";
import { queryClient } from "~utils/tanstack";
import browser from "webextension-polyfill";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { trackPage, PageType, trackEvent, EventType } from "~utils/analytics";
import { useAoRateLimitedToast } from "~utils/toast/toast.hooks";

export interface ArNSConfirmSetPrimaryNameViewParams {
  name: string;
}
export type ArNSConfirmSetPrimaryNameViewProps = CommonRouteProps<ArNSConfirmSetPrimaryNameViewParams>;

export const ArNSConfirmSetPrimaryNameView = ({ params: { name } }: ArNSConfirmSetPrimaryNameViewProps) => {
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);

  const [transactionState, setTransactionState] = useState<string | undefined>();

  const { data: costDetails } = usePrimaryNameCostDetails({ name });
  const { data: ticker } = useTicker();

  const { showAoRateLimitedToast } = useAoRateLimitedToast();

  const costDetailsArio = useMemo(() => {
    return costDetails ? new mARIOToken(costDetails.tokenCost).toARIO().valueOf() : undefined;
  }, [costDetails]);

  const formattedCost = useMemo(() => {
    return costDetails ? formatArio(costDetailsArio) : undefined;
  }, [costDetailsArio]);

  const arioBalance = useArioBalance();

  const wallet = useActiveWallet();

  const { navigate } = useLocation();

  const handleConfirmSetPrimaryName = async () => {
    try {
      setProcessingTransaction(true);
      setTransactionState(browser.i18n.getMessage("processing_transactions"));

      const result = await setPrimaryName({
        name,
        transactionListener: (transactionState) => {
          log(LOG_GROUP.ARNS, "transaction state received: ", transactionState);
          setTransactionState(transactionState);
        },
      });

      if (result.success) {
        // wait to account for delay in message cranking in AO
        // cranking usually has either a slight delay or is hung, and this
        // accounts for the common case of the slight delay
        await sleep(2000);

        await ARNS_QUERY_CLIENT.invalidateQueries({
          queryKey: ["arns-profile", wallet.address],
        });
        await NAME_SERVICE_QUERY_CLIENT.invalidateQueries({
          queryKey: ["name-service-profile", wallet.address],
        });
        await NAME_SERVICE_QUERY_CLIENT.invalidateQueries({
          queryKey: ["name-service-profile-hook", wallet.address],
        });
        await NAME_SERVICE_QUERY_CLIENT.invalidateQueries({
          queryKey: ["name-service-profiles"],
        });
        await queryClient.invalidateQueries({ queryKey: ["tokenBalance", ARIO_PROCESS_ID, wallet.address] });

        trackEvent(EventType.ARNS_SET_PRIMARY_NAME_SUCCESS, { name });

        navigate(`/arns/primary-name-success/${name}/${result.transactionId}`);
      } else {
        trackEvent(EventType.ARNS_SET_PRIMARY_NAME_ERROR, { name });
        showAoRateLimitedToast(new Error(result?.error || ""));
        navigate(`/arns/primary-name-error/${name}`);
      }
    } catch (error) {
      log(LOG_GROUP.ARNS, "error: ", error);
      trackEvent(EventType.ARNS_SET_PRIMARY_NAME_ERROR, { name });
      showAoRateLimitedToast(error);
      navigate(`/arns/primary-name-error/${name}`);
    } finally {
      setProcessingTransaction(false);
      setTransactionState(undefined);
    }
  };

  useEffect(() => {
    trackPage(PageType.ARNS_SET_PRIMARY_NAME);
  }, []);

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title={browser.i18n.getMessage("confirm_transaction")} />
      <CardContainer style={{ margin: "1.5rem" }}>
        <Text variant="secondary" size="2xs">
          {browser.i18n.getMessage("set_primary_name")}
        </Text>
        <Text size="xl" weight="semibold" style={{ wordBreak: "break-all", textAlign: "center" }}>
          {decodeDomainToASCII(name)}
        </Text>
      </CardContainer>
      <Flex style={{ justifyContent: "space-between", margin: "0 2rem" }}>
        <Text variant="secondary" size="sm">
          {browser.i18n.getMessage("cost")}
        </Text>
        <Text size="sm" style={{ textAlign: "right" }}>
          {formattedCost ?? "..."} {ticker}
        </Text>
      </Flex>
      <div style={{ flex: 1 }}></div>
      <div style={{ margin: "1.5rem" }}>
        <Button
          onClick={handleConfirmSetPrimaryName}
          fullWidth
          disabled={processingTransaction || !costDetails || !arioBalance || arioBalance < costDetailsArio}>
          {arioBalance == undefined
            ? browser.i18n.getMessage("loading_balance")
            : arioBalance < costDetailsArio
              ? browser.i18n.getMessage("insufficient_balance")
              : browser.i18n.getMessage("confirm")}
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
