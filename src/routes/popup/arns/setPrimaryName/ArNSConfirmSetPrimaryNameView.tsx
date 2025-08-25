import { Button, Text } from "@arconnect/components-rebrand";
import { useMemo, useState } from "react";
import { Flex } from "~components/common/Flex";
import HeadV2 from "~components/popup/HeadV2";
import { ARNS_QUERY_CLIENT, setPrimaryName, useArioBalance, usePrimaryNameCostDetails, useTicker } from "~lib/arns";
import { NAME_SERVICE_QUERY_CLIENT } from "~lib/nameservice";
import { useActiveWallet } from "~wallets/hooks";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { CardContainer } from "../CardContainer";
import TransactionStatusModal from "../TransactionStatusModal";
import { sleep } from "~utils/promises/sleep";
import { decodeDomainToASCII, formatArio } from "../utils";
import { mARIOToken } from "@ar.io/sdk/web";

export interface ArNSConfirmSetPrimaryNameViewParams {
  name: string;
}
export type ArNSConfirmSetPrimaryNameViewProps = CommonRouteProps<ArNSConfirmSetPrimaryNameViewParams>;

export const ArNSConfirmSetPrimaryNameView = ({ params: { name } }: ArNSConfirmSetPrimaryNameViewProps) => {
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);

  const [transactionState, setTransactionState] = useState<string | undefined>();

  const { data: costDetails } = usePrimaryNameCostDetails({ name });
  const { data: ticker } = useTicker();

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
      setTransactionState("Processing transactions...");

      const result = await setPrimaryName({
        name,
        transactionListener: (transactionState) => {
          console.log("transaction state received: ", transactionState);
          setTransactionState(transactionState);
        },
      });

      if (result.success) {
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
        navigate(`/arns/primary-name-success/${name}/${result.transactionId}`);
      } else {
        navigate(`/arns/primary-name-error/${name}`);
      }
    } catch (error) {
      console.log(error);
      navigate(`/arns/primary-name-error/${name}`);
    } finally {
      setProcessingTransaction(false);
      setTransactionState(undefined);
    }
  };

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title="Confirm Transaction" />
      <CardContainer style={{ margin: "1.5rem" }}>
        <Text variant="secondary" size="2xs">
          SET PRIMARY NAME
        </Text>
        <Text size="xl" weight="semibold">
          {decodeDomainToASCII(name)}
        </Text>
      </CardContainer>
      <Flex style={{ justifyContent: "space-between", margin: "0 2rem" }}>
        <Text variant="secondary" size="sm">
          Cost
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
            ? "Loading balance..."
            : arioBalance < costDetailsArio
              ? "Insufficient balance"
              : "Confirm"}
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
