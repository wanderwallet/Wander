import HeadV2 from "~components/popup/HeadV2";
import { Address, AddressWrapper, BodySection } from "../send/confirm";
import styled from "styled-components";
import { prepare, send } from "~subscriptions/payments";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { getActiveAddress } from "~wallets";
import {
  addSubscription,
  getSubscriptionData,
  trackCanceledSubscription,
  updateSubscription
} from "~subscriptions";
import { formatAddress } from "~utils/format";
import {
  SubscriptionStatus,
  type SubscriptionData
} from "~subscriptions/subscription";
import { ArrowRightIcon } from "@iconicicons/react";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { ButtonV2, useToasts } from "@arconnect/components";
import { useLocation } from "~wallets/router/router.utils";
import { getPrice } from "~lib/coingecko";
import useSetting from "~settings/hook";
import BigNumber from "bignumber.js";
import type { CommonRouteProps } from "~wallets/router/router.types";

export interface SubscriptionPaymentViewParams {
  id?: string;
}

export type SubscriptionPaymentViewProps =
  CommonRouteProps<SubscriptionPaymentViewParams>;

export function SubscriptionPaymentView({
  params: { id }
}: SubscriptionPaymentViewProps) {
  const { back } = useLocation();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [price, setPrice] = useState<string>("--");
  const [currency] = useSetting<string>("currency");
  const { setToast } = useToasts();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const cancel = async () => {
    try {
      await updateSubscription(
        activeAddress,
        subData.arweaveAccountAddress,
        SubscriptionStatus.CANCELED
      );
      await trackCanceledSubscription(subData, false);
      setToast({
        type: "success",
        content: browser.i18n.getMessage("subscription_cancelled"),
        duration: 5000
      });
      back();
    } catch {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("subscription_cancelled_error"),
        duration: 5000
      });
    }
  };

  const handlePayment = async (subscription: SubscriptionData) => {
    try {
      const now = new Date();
      const nextPaymentDue = new Date(subscription.nextPaymentDue);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (now.getTime() > nextPaymentDue.getTime() + oneWeek) {
        throw new Error("Payment is paying for more than a week past due.");
      }
      const prepared = await prepare(
        subscription.arweaveAccountAddress,
        subscription,
        activeAddress
      );
      try {
        const submitted = await send(
          activeAddress,
          prepared,
          subscription,
          true
        );
        submitted.subscriptionStatus = SubscriptionStatus.ACTIVE;
        await addSubscription(activeAddress, submitted);

        setToast({
          type: "success",
          content: "Subscription paid",
          duration: 5000
        });
        back();
      } catch (e) {
        console.log("e", e);
        setToast({
          type: "error",
          content: "Issue processing payment",
          duration: 5000
        });
      }
      return;
    } catch (e) {
      console.log("err", e);
    }
  };

  useEffect(() => {
    async function getSubData() {
      try {
        const address = await getActiveAddress();
        const data = await getSubscriptionData(address);
        // finding like this for now
        const subscription = data.find(
          (subscription) => subscription.arweaveAccountAddress === id
        );
        setSubData(subscription);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    }

    // segment

    getSubData();
  }, []);

  useEffect(() => {
    async function fetchArPrice() {
      const arPrice = await getPrice("arweave", currency);
      if (arPrice) {
        setPrice(
          BigNumber(arPrice)
            .multipliedBy(subData.subscriptionFeeAmount)
            .toFixed(2)
        );
      }
    }

    fetchArPrice();
  }, [subData, currency]);

  return (
    <Wrapper>
      <HeadV2 title="Renew Subscription" />

      {subData &&
      subData.subscriptionStatus === SubscriptionStatus.AWAITING_PAYMENT ? (
        <Body>
          <div>
            <AddressWrapper>
              <Address>
                <span style={{ color: "#aeadcd" }}>
                  ({activeAddress && formatAddress(activeAddress, 5)})
                </span>
              </Address>
              <ArrowRightIcon />
              <Address>
                <span style={{ color: "#aeadcd" }}>
                  ({subData && formatAddress(subData.arweaveAccountAddress, 5)})
                </span>
              </Address>
            </AddressWrapper>
            <div style={{ marginTop: "16px" }}>
              <BodySection
                ticker={"AR"}
                value={subData.subscriptionFeeAmount.toString()}
                title={`Sending AR`}
                estimatedValue={price}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <ButtonV2
              fullWidth
              style={{ fontWeight: "500" }}
              onClick={async () => await handlePayment(subData)}
            >
              Pay Subscription
            </ButtonV2>
            <ButtonV2
              fullWidth
              style={{ fontWeight: "500", backgroundColor: "#8C1A1A" }}
              onClick={async () => await cancel()}
            >
              Cancel Subscription
            </ButtonV2>
          </div>
        </Body>
      ) : (
        <div>No Subscription to pay for</div>
      )}
    </Wrapper>
  );
}

const Body = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
`;
