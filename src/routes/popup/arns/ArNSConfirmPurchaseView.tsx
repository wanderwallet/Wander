import { ButtonV2 } from "@arconnect/components";
import { Text } from "@arconnect/components-rebrand";
import { useState } from "react";
import { Flex } from "~components/common/Flex";
import { ArioIcon } from "~components/embed";
import HeadV2 from "~components/popup/HeadV2";
import { ARNS_QUERY_CLIENT, purchaseArNSName, useRegistrationFee, useTicker } from "~lib/arns";
import { useActiveWallet } from "~wallets/hooks";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { RegisteringCard } from "./RegisteringCard";
import TransactionStatusModal from "./TransactionStatusModal";
import type { PurchaseType } from "./types";
import { decodeDomainToASCII, lowerCaseDomain } from "./utils";

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

  const { data: totalFee } = useRegistrationFee(name, purchaseType, purchaseYears);
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);

  const [transactionState, setTransactionState] = useState<string | undefined>();

  const wallet = useActiveWallet();

  const { navigate } = useLocation();

  const handleConfirmPurchase = async () => {
    try {
      setProcessingTransaction(true);
      setTransactionState("Processing transactions...");

      const safeDomain = lowerCaseDomain(name);

      const result = await purchaseArNSName({
        name: safeDomain,
        purchaseType,
        purchaseYears,
        transactionListener: (transactionState) => {
          console.log("transaction state received: ", transactionState);
          setTransactionState(transactionState);
        },
      });

      await ARNS_QUERY_CLIENT.invalidateQueries({
        queryKey: ["arns-records-for-address", wallet.address],
      });
      navigate(`/arns/purchase-success/${name}/${purchaseType}/${purchaseYears}/${result.transactionId}`);
    } catch (error) {
      console.log(error);
      navigate(`/arns/purchase-error/${name}/${purchaseType}/${purchaseYears}`);
    } finally {
      setProcessingTransaction(false);
      setTransactionState(undefined);
    }
  };

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title="Confirm Transaction" />
      <RegisteringCard
        style={{ margin: "0 1.5rem" }}
        name={decodeDomainToASCII(name)}
        purchaseType={purchaseType}
        purchaseYears={purchaseYears}
      />
      <Flex style={{ margin: "1rem" }} justify="center" align="center" gap=".25rem">
        <Text size="2xl" weight="semibold" style={{ textAlign: "center" }}>
          {totalFee ?? "..."}
        </Text>
        <Text>{ticker}</Text>
        <ArioIcon width=".75rem" height=".75rem" />
      </Flex>
      <div style={{ flex: 1 }}></div>
      <div style={{ margin: "1.5rem" }}>
        <ButtonV2 onClick={handleConfirmPurchase} fullWidth disabled={processingTransaction || !totalFee}>
          Confirm
        </ButtonV2>
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
