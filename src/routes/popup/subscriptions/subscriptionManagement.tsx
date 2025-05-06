import { type SubscriptionData } from "~subscriptions/subscription";
import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { getSubscriptionData } from "~subscriptions";
import { ButtonV2, ListItem } from "@arconnect/components";
import { Degraded, WarningWrapper } from "../send";
import { WarningIcon } from "~components/popup/Token";
import Title from "~components/popup/Title";
import type { CommonRouteProps } from "~wallets/router/router.types";

export interface SubscriptionManagementViewParams {
  id?: string;
}

export type SubscriptionManagementViewProps = CommonRouteProps<SubscriptionManagementViewParams>;

export function SubscriptionManagementView({ params: { id } }: SubscriptionManagementViewProps) {
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [nextPayment, setNextPayment] = useState<Date | null>(null);

  useEffect(() => {
    async function getSubData() {
      const address = await getActiveAddress();

      try {
        if (address) {
          const data = await getSubscriptionData(address);
          // finding like this for now
          const subscription = data.find((subscription) => subscription.arweaveAccountAddress === id);
          setSubData(subscription);
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    }

    getSubData();
  }, []);

  useEffect(() => {
    const getAlarms = async () => {
      try {
        const alarms = await browser.alarms.getAll();
        const nextPaymentAlarm = alarms.find((alarm) => alarm.name === `subscription-alarm-${id}`);
        if (nextPaymentAlarm) {
          setNextPayment(new Date(nextPaymentAlarm.scheduledTime));
        }
      } catch (error) {}
    };

    getAlarms();
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <HeadV2 title={subData?.applicationName} />
      <Wrapper>
        {subData && (
          <>
            <PaymentHistory>
              <NextPaymentSection>
                <Degraded style={{ margin: 0 }}>
                  <WarningWrapper>
                    <WarningIcon color="#fff" />
                  </WarningWrapper>
                  <div>
                    <span>
                      <Title style={{ margin: 0 }}>Next Payment</Title>
                      <p style={{ margin: 0 }}>
                        {nextPayment ? nextPayment.toLocaleString() : "No upcoming payment scheduled."}
                      </p>
                    </span>
                  </div>
                </Degraded>
              </NextPaymentSection>
              <Title style={{ margin: "12px 0" }}>Payment History</Title>
              {subData.paymentHistory.length > 0 && (
                <>
                  {subData.paymentHistory.map((payment, index) => (
                    <ListItem
                      small
                      img={subData?.applicationIcon}
                      title={new Date(payment.date).toLocaleString()}
                      description={payment.txId}
                      key={index}
                      onClick={() =>
                        browser.tabs.create({
                          url: `https://viewblock.io/arweave/tx/${payment.txId}`,
                        })
                      }
                    />
                  ))}
                </>
              )}
            </PaymentHistory>
          </>
        )}
        <ButtonV2
          fullWidth
          style={{ fontWeight: "500" }}
          onClick={() => browser.tabs.create({ url: subData.subscriptionManagementUrl })}>
          View Subscription
        </ButtonV2>
      </Wrapper>
    </div>
  );
}

const Wrapper = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-x: scroll;
  height: calc(100% - 96px);
`;

const PaymentHistory = styled.div`
  h3 {
    font-size: 1.5em;
    margin: 0;
  }
  ul {
    list-style-type: none;
    padding: 10px 0;

    li {
      padding: 10px;
      border: 1px solid #ccc;
      cursor: pointer;
      border-radius: 10px;
      margin-bottom: 10px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #1b1b1b;
      }
      p {
        margin: 5px 0;
      }
    }
  }
`;

const NextPaymentSection = styled.div`
  h3 {
    font-size: 1.5em;
    margin: 10px 0;
  }
  p {
    font-size: 1.2em;
  }
`;
