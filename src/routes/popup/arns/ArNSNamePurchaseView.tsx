import { Button, Card, Text } from "@arconnect/components-rebrand";
import { MinusIcon, PlusIcon } from "@iconicicons/react";
import { useMemo, useState } from "react";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import HeadV2 from "~components/popup/HeadV2";
import { useArioBalance, useRegistrationFee, useTicker } from "~lib/arns";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import type { PurchaseType } from "./types";
import { formatArio } from "./utils";
import browser from "webextension-polyfill";

export interface ArNSNamePurchaseViewParams {
  name: string;
}
export type ArNSNamePurchaseViewProps = CommonRouteProps<ArNSNamePurchaseViewParams>;

export const ArNSNamePurchaseView = ({ params: { name } }: ArNSNamePurchaseViewProps) => {
  const { navigate } = useLocation();

  const { data: ticker } = useTicker();
  const arioBalance = useArioBalance();

  const [purchaseType, setPurchaseType] = useState<PurchaseType>("lease");
  const [purchaseYears, setPurchaseYears] = useState(1);

  const { data: totalFee } = useRegistrationFee(name, purchaseType, purchaseYears);

  const totalFeeString = useMemo(() => {
    return totalFee ? formatArio(totalFee) : "...";
  }, [totalFee]);

  const untilDateString = useMemo(() => {
    return new Date(Date.now() + purchaseYears * 365 * 24 * 60 * 60 * 1000).toLocaleDateString();
  }, [purchaseYears]);

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title="Purchase ArNS" />
      <RegisteringCard>
        <Text noMargin variant="secondary" size="2xs">
          {browser.i18n.getMessage("registering")}
        </Text>
        <Text size="lg" weight="semibold" style={{ wordBreak: "break-all", textAlign: "center" }}>
          ar://{name}
        </Text>
      </RegisteringCard>
      <div style={{ margin: "0 2rem", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <TabButton onClick={() => setPurchaseType("lease")} $selected={purchaseType === "lease"}>
          <Text weight="semibold" variant={purchaseType === "lease" ? "primary" : "secondary"}>
            {browser.i18n.getMessage("lease")}
          </Text>
        </TabButton>
        <TabButton onClick={() => setPurchaseType("permabuy")} $selected={purchaseType === "permabuy"}>
          <Text weight="semibold" variant={purchaseType === "permabuy" ? "primary" : "secondary"}>
            {browser.i18n.getMessage("purchase")}
          </Text>
        </TabButton>
      </div>
      {purchaseType === "lease" && (
        <Flex
          style={{ margin: "0 1.5rem" }}
          textAlign="center"
          justify="center"
          padding="2rem"
          gap="1rem"
          align="center">
          <CircleButton onClick={() => setPurchaseYears(Math.max(1, purchaseYears - 1))}>
            <MinusIcon />
          </CircleButton>
          <div>
            <Text size="2xl" weight="semibold">
              {purchaseYears} {purchaseYears == 1 ? browser.i18n.getMessage("year") : browser.i18n.getMessage("years")}
            </Text>
            <Text variant="secondary" size="xs">
              {browser.i18n.getMessage("until")} {untilDateString}
            </Text>
          </div>
          <CircleButton onClick={() => setPurchaseYears(Math.min(5, purchaseYears + 1))}>
            <PlusIcon />
          </CircleButton>
        </Flex>
      )}
      {purchaseType === "permabuy" && (
        <Flex direction="column" style={{ margin: "0 1.5rem" }} textAlign="center" padding="2rem">
          <Text size="2xl" weight="semibold">
            {browser.i18n.getMessage("permanent")}
          </Text>
        </Flex>
      )}
      <RegisteringCard style={{ margin: "0 1.5rem" }}>
        <Flex style={{ width: "100%" }}>
          <Text style={{ textAlign: "left", flexGrow: 1, fontSize: "1rem" }}>{browser.i18n.getMessage("price")}</Text>
          <Text style={{ fontSize: "1rem", fontWeight: 500 }}>
            {totalFeeString} {ticker}
          </Text>
        </Flex>
      </RegisteringCard>
      <div style={{ flex: 1 }}></div>
      <div style={{ margin: "1.5rem" }}>
        <Button
          onClick={() => {
            navigate(`/arns/confirm-purchase/${name}/${purchaseType}/${purchaseYears}`);
          }}
          fullWidth
          disabled={arioBalance == undefined || totalFee == undefined || totalFee > arioBalance}>
          {arioBalance == undefined
            ? browser.i18n.getMessage("loading_balance")
            : totalFee == undefined
              ? browser.i18n.getMessage("calculating_fee")
              : totalFee > arioBalance
                ? browser.i18n.getMessage("insufficient_balance")
                : browser.i18n.getMessage("next")}
        </Button>
      </div>
    </Flex>
  );
};

const CircleButton = styled.button`
  cursor: pointer;
  background: ${(props) => props.theme.surfaceSecondary};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }
`;

const RegisteringCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  margin: 1rem 1.5rem;
  text-align: center;
  background: ${(props) => props.theme.surfaceSecondary};
  border-radius: 12px;
  gap: 0.5rem;
`;

const TabButton = styled.button<{ $selected: boolean }>`
  padding: 0.5rem;
  flex-grow: 0.5;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  ${(props) => props.$selected && `border-bottom-color: #5842F8;`}
`;
