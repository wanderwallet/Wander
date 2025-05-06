import { SubscriptionStatus, type SubscriptionData } from "~subscriptions/subscription";
import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { getSubscriptionData, updateSubscription } from "~subscriptions";
import { useTheme } from "~utils/theme";
import type { DisplayTheme } from "@arconnect/components";
import { PageType, trackPage } from "~utils/analytics";
import { SubscriptionListItem } from "~components/popup/list/SubscriptionListItem";

export function SubscriptionsView() {
  const [subData, setSubData] = useState<SubscriptionData[] | null>(null);
  const theme = useTheme();

  useEffect(() => {
    async function getSubData() {
      const address = await getActiveAddress();

      try {
        const data = await getSubscriptionData(address);
        // updates status if it's past due
        data.forEach(async (subscription) => {
          if (
            subscription.subscriptionStatus === SubscriptionStatus.ACTIVE ||
            subscription.subscriptionStatus === SubscriptionStatus.AWAITING_PAYMENT
          ) {
            const nextPaymentDue = new Date(subscription.nextPaymentDue);
            const now = new Date();
            if (nextPaymentDue < now) {
              const daysPastDue = Math.floor((now.getTime() - nextPaymentDue.getTime()) / (1000 * 60 * 60 * 24));

              if (daysPastDue >= 2) {
                await updateSubscription(address, subscription.arweaveAccountAddress, SubscriptionStatus.EXPIRED);
              } else {
                await updateSubscription(
                  address,
                  subscription.arweaveAccountAddress,
                  SubscriptionStatus.AWAITING_PAYMENT,
                );
              }
            }
          }
        });
        setSubData(data);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    }

    // Segment
    trackPage(PageType.SUBSCRIPTIONS);

    getSubData();
  }, []);

  return (
    <div>
      <HeadV2 title={browser.i18n.getMessage("subscriptions")} />
      {subData && subData.length > 0 ? (
        <SubscriptionList>
          {subData.map((sub) => {
            return (
              <SubscriptionListItem
                id={sub.arweaveAccountAddress}
                title={sub.applicationName}
                icon={sub.applicationIcon}
                expiration={sub.nextPaymentDue}
                status={sub.subscriptionStatus}
                frequency={sub.recurringPaymentFrequency}
                amount={sub.subscriptionFeeAmount}
              />
            );
          })}
        </SubscriptionList>
      ) : (
        <NoSubscriptionWrapper displayTheme={theme}>
          <div>{browser.i18n.getMessage("no_subscriptions")}</div>
          <span>{browser.i18n.getMessage("no_subscriptions_description")}</span>
        </NoSubscriptionWrapper>
      )}
    </div>
  );
}

const SubscriptionList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #333333;
  border-radius: 10px;
  margin: 0 15px;
`;

const NoSubscriptionWrapper = styled.div<{ displayTheme?: DisplayTheme }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 65px);
  text-align: center;
  gap: 10px;
  padding: 0 85px;

  div {
    font-size: 20px;
    font-weight: 500;
  }
  span {
    font-size: 16px;
    font-weight: 400;
    color: ${(props) => (props.displayTheme === "dark" ? "#a3a3a3" : "#757575")};
  }
`;

/*
type SquircleProps = {
  color?: string;
  customSize?: string;
};

export const AppIcon = styled(Squircle)<SquircleProps>`
  color: ${(props) => props.color || `rgb(${props.theme.theme})`};
  width: ${(props) => props.customSize || "2rem"};
  height: ${(props) => props.customSize || "2rem"};
  cursor: pointer;
`;
*/
