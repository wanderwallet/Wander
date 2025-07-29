import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Text, Card, Spacer } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useEffect, useMemo, useState } from "react";
import { formatArio } from "./utils";
import { getPriceDetails, purchaseArNSName, useTicker } from "~lib/arns";
import { ButtonV2 } from "@arconnect/components";
import type { PurchaseType } from "./types";
import { Line } from "../purchase";
import { ArioIcon } from "~components/embed";
import TransactionStatusModal from "./TransactionStatusModal";
import { useLocation } from "~wallets/router/router.utils";

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
      const priceDetails = await getPriceDetails(name);
      const arioPrice =
        purchaseType === "lease" ? priceDetails.arf + priceDetails.af * purchaseYears : priceDetails.permabuyFee;
      setTotalFee(formatArio(arioPrice));
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
      }
    } catch (error) {
      console.log(error);
    } finally {
      setProcessingTransaction(false);
      setTransactionState(undefined);
    }
  };

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title="Confirm Transaction" />
      <RegisteringCard>
        <Text noMargin variant="secondary" size="2xs">
          REGISTERING
        </Text>
        <Text size="lg" weight="semibold" style={{ wordBreak: "break-all" }}>
          ar://{name}
        </Text>
        <Line style={{ margin: ".25rem 0" }} />
        <Flex width="100%">
          <Text size="sm" variant="secondary" style={{ textAlign: "left", flexGrow: 1 }}>
            Registration Period
          </Text>
          <Text size="sm" weight="semibold">
            {purchaseType === "lease" ? `Lease (${purchaseYears} ${purchaseYears == 1 ? "Year" : "Years"})` : `Buy (∞)`}
          </Text>
        </Flex>
      </RegisteringCard>
      <Flex style={{ margin: "1rem" }} justify="center" align="center" gap=".25rem">
        <Text size="2xl" weight="semibold" style={{ textAlign: "center" }}>
          {totalFee}
        </Text>
        <Text>{ticker}</Text>
        <ArioIcon width=".75rem" height=".75rem" />
      </Flex>
      <div style={{ flex: 1 }}></div>
      <div style={{ margin: "1rem" }}>
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

const RegisteringCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  margin: 1rem;
  text-align: center;
  background: ${(props) => props.theme.surfaceSecondary};
  border-radius: 12px;
  gap: 0.5rem;
`;
