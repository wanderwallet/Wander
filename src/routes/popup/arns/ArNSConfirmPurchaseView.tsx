import { ButtonV2 } from "@arconnect/components";
import { Text } from "@arconnect/components-rebrand";
import { useEffect, useState } from "react";
import { Flex } from "~components/common/Flex";
import { ArioIcon } from "~components/embed";
import HeadV2 from "~components/popup/HeadV2";
import { getRegistrationFees, purchaseArNSName, useTicker } from "~lib/arns";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { RegisteringCard } from "./RegisteringCard";
import TransactionStatusModal from "./TransactionStatusModal";
import type { PurchaseType } from "./types";
import { formatArio } from "./utils";
import { mARIOToken } from "@ar.io/sdk/web";

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

  const [totalFee, setTotalFee] = useState<string>("");
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);

  const [transactionState, setTransactionState] = useState<string | undefined>();

  const { navigate } = useLocation();

  useEffect(() => {
    const fetchTotalFee = async () => {
      const registrationFees = await getRegistrationFees();

      if (registrationFees) {
        const fee = registrationFees[name.length.toString()];

        const mArioPrice = purchaseType === "lease" ? fee.lease[purchaseYears.toString()] : fee.permabuy;
        const arioPrice = new mARIOToken(mArioPrice).toARIO().valueOf();

        setTotalFee(formatArio(arioPrice));
      }
    };
    fetchTotalFee();
  }, [purchaseType, purchaseYears]);

  const handleConfirmPurchase = async () => {
    try {
      setProcessingTransaction(true);
      setTransactionState("Processing transactions...");
      const result = await purchaseArNSName({
        name,
        purchaseType,
        purchaseYears,
        transactionListener: (transactionState) => {
          console.log("transaction state received: ", transactionState);
          setTransactionState(transactionState);
        },
      });

      console.log("RESULT", result);

      if (result.success) {
        navigate(`/arns/purchase-success/${name}/${purchaseType}/${purchaseYears}/${result.transactionId}`);
      } else {
        navigate(`/arns/purchase-error/${name}/${purchaseType}/${purchaseYears}`);
      }
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
        name={name}
        purchaseType={purchaseType}
        purchaseYears={purchaseYears}
      />
      <Flex style={{ margin: "1rem" }} justify="center" align="center" gap=".25rem">
        <Text size="2xl" weight="semibold" style={{ textAlign: "center" }}>
          {totalFee}
        </Text>
        <Text>{ticker}</Text>
        <ArioIcon width=".75rem" height=".75rem" />
      </Flex>
      <div style={{ flex: 1 }}></div>
      <div style={{ margin: "1.5rem" }}>
        <ButtonV2 onClick={handleConfirmPurchase} fullWidth disabled={processingTransaction}>
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
