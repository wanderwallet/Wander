import { Tooltip, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import {
  Body,
  InfoCircle,
  InfoText,
  Main,
  PaymentDetails,
  SubscriptionListItem,
  SubscriptionText,
  ToggleSwitch
} from "~routes/popup/subscriptions/subscriptionDetails";
import { Content, Title } from "~components/popup/list/SubscriptionListItem";
import dayjs from "dayjs";
import { addSubscription } from "~subscriptions";
import { getActiveAddress } from "~wallets";
import {
  type RecurringPaymentFrequency,
  type SubscriptionData,
  SubscriptionStatus
} from "~subscriptions/subscription";
import {
  SettingIconWrapper,
  SettingImage
} from "~components/dashboard/list/BaseElement";
import { useTheme } from "~utils/theme";
import { formatAddress } from "~utils/format";
import { useEffect, useState } from "react";
import { getPrice } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { EventType, trackEvent } from "~utils/analytics";
import { handleSubscriptionPayment } from "~subscriptions/payments";
import BigNumber from "bignumber.js";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";

export function SubscriptionAuthRequestView() {
  const { authRequest, acceptRequest, rejectRequest } =
    useCurrentAuthRequest("subscription");

  const { url, subscriptionFeeAmount } = authRequest;

  const { setToast } = useToasts();
  const [currency] = useSetting<string>("currency");
  const [checked, setChecked] = useState<boolean>(false);
  const [autopayChecked, setAutopayChecked] = useState<boolean>(false);
  const theme = useTheme();
  const [price, setPrice] = useState<BigNumber | null>();

  useEffect(() => {
    async function fetchArPrice() {
      const arPrice = await getPrice("arweave", currency);
      if (arPrice) {
        setPrice(BigNumber(arPrice).multipliedBy(subscriptionFeeAmount));
      }
    }

    fetchArPrice();
  }, [currency, subscriptionFeeAmount]);

  // TODO TRIGGER PAYMENT WHEN ADDING NEW SUBSCRIPTION

  async function done() {
    // add subscription to storage
    try {
      const { authID, ...subscriptionParams } = authRequest;
      const activeAddress = await getActiveAddress();

      // process payment
      // append txid to payment history array
      const subscriptionData: SubscriptionData = {
        arweaveAccountAddress: subscriptionParams.arweaveAccountAddress,
        applicationName: subscriptionParams.applicationName,
        subscriptionName: subscriptionParams.subscriptionName,
        subscriptionFeeAmount: subscriptionParams.subscriptionFeeAmount,
        subscriptionManagementUrl: subscriptionParams.subscriptionManagementUrl,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        recurringPaymentFrequency:
          subscriptionParams.recurringPaymentFrequency as RecurringPaymentFrequency,

        // If this is left blank, this will automatically be set to the subfee amount
        // applicationAllowance: !isNaN(Number(allowanceInput.state))
        //   ? Number(allowanceInput.state)
        //   : params.subscriptionFeeAmount,

        applicationAllowance: autopayChecked
          ? subscriptionParams.subscriptionFeeAmount
          : 0,

        nextPaymentDue: new Date(),

        // TODO:  this should be default started to now
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(subscriptionParams.subscriptionEndDate),
        applicationIcon: subscriptionParams.applicationIcon,
        applicationAutoRenewal: checked
      };

      const updated = await handleSubscriptionPayment(subscriptionData, true);

      if (updated) {
        await addSubscription(activeAddress, updated);
      } else {
        throw new Error();
      }

      // segment
      await trackEvent(EventType.SUBSCRIBED, {
        applicationName: subscriptionData.applicationName,
        arweaveAccountAddress: subscriptionData.arweaveAccountAddress,
        recurringPaymentFrequency: subscriptionData.recurringPaymentFrequency,
        subscriptionFeeAmount: subscriptionData.subscriptionFeeAmount,
        applicationUrl: url || subscriptionParams.subscriptionManagementUrl,
        autoPay: autopayChecked,
        autoRenewal: checked
      });

      await acceptRequest();
    } catch (e) {
      console.log(e, "Failed to subscribe");
      setToast({
        type: "error",
        content: browser.i18n.getMessage("subscription_add_failure"),
        duration: 2200
      });
    }
  }

  return (
    <>
      <HeadAuth title={browser.i18n.getMessage("subscriptions")} />
      <Wrapper>
        <Main>
          <SubscriptionListItem>
            <Content>
              <SettingIconWrapper
                bg={theme === "light" ? "235,235,235" : "255, 255, 255"}
                customSize="2.625rem"
              >
                {authRequest.applicationIcon && (
                  <SettingImage src={authRequest.applicationIcon} />
                )}
              </SettingIconWrapper>
              <Title>
                <h2>{authRequest.applicationName}</h2>
                <h3 style={{ fontSize: "12px" }}>
                  Status: <span style={{ color: "#CFB111" }}>Pending</span>
                </h3>
              </Title>
            </Content>
          </SubscriptionListItem>
          <SubscriptionText color={theme === "light" ? "#191919" : "#ffffff"}>
            {browser.i18n.getMessage("subscription_application_address")}:{" "}
            <span>{formatAddress(authRequest.arweaveAccountAddress, 8)}</span>
          </SubscriptionText>
          <PaymentDetails>
            <h6>Recurring payment amount</h6>
            <Body>
              <h3>{authRequest.subscriptionFeeAmount} AR</h3>
              <SubscriptionText
                fontSize="14px"
                color={theme === "light" ? "#191919" : "#ffffff"}
              >
                {browser.i18n.getMessage("subscriptions")}:{" "}
                {browser.i18n.getMessage(authRequest.recurringPaymentFrequency)}
              </SubscriptionText>
            </Body>
            <Body>
              <SubscriptionText fontSize="14px">
                ${price ? price.toFixed(2) : "--.--"} {currency}
              </SubscriptionText>
              <SubscriptionText
                fontSize="14px"
                color={theme === "light" ? "#191919" : "#ffffff"}
              >
                {browser.i18n.getMessage("next_payment")}:{" "}
                {dayjs(authRequest.nextPaymentDue).format("MMM DD, YYYY")}
              </SubscriptionText>
            </Body>
          </PaymentDetails>
          <div />
          <div>
            <Body>
              <SubscriptionText
                fontSize="14px"
                color={theme === "light" ? "#191919" : "#ffffff"}
              >
                {browser.i18n.getMessage("start")}
              </SubscriptionText>
              <SubscriptionText
                fontSize="14px"
                color={theme === "light" ? "#191919" : "#ffffff"}
              >
                {browser.i18n.getMessage("end")}
              </SubscriptionText>
            </Body>
            <Body>
              <SubscriptionText>
                {dayjs().format("MMM D, YYYY")}
              </SubscriptionText>
              <SubscriptionText>
                {dayjs(authRequest.subscriptionEndDate).format("MMM D, YYYY")}
              </SubscriptionText>
            </Body>
          </div>
          {/* Toggle */}
          <Body>
            <SubscriptionText color={theme === "light" ? "#191919" : "#ffffff"}>
              {browser.i18n.getMessage("auto_renewal")}
            </SubscriptionText>
            <ToggleSwitch checked={checked} setChecked={setChecked} />
          </Body>
          <Body>
            <SubscriptionText color={theme === "light" ? "#191919" : "#ffffff"}>
              {browser.i18n.getMessage("auto_pay")}
              <Tooltip content={InfoText} position="bottom">
                <InfoCircle />
              </Tooltip>
            </SubscriptionText>
            <ToggleSwitch
              checked={autopayChecked}
              setChecked={setAutopayChecked}
            />
          </Body>
          {/* <Threshold>
              <Body>
                <SubscriptionText
                  color={theme === "light" ? "#191919" : "#ffffff"}
                >
                  Allowance{" "}
                  <TooltipV2 content={InfoText} position="bottom">
                    <InfoCircle />
                  </TooltipV2>
                </SubscriptionText>
              </Body>
              <InputV2 {...allowanceInput.bindings} fullWidth />
            </Threshold> */}
        </Main>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <AuthButtons
            authRequest={authRequest}
            primaryButtonProps={{
              label: browser.i18n.getMessage("confirm_subscription"),
              onClick: done,
              style: { fontWeight: "500" }
            }}
            secondaryButtonProps={{
              label: browser.i18n.getMessage("cancel"),
              onClick: () => rejectRequest(),
              style: { fontWeight: "500", backgroundColor: "#8C1A1A" }
            }}
          />
        </div>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  justify-content: space-between;
  padding: 15px;
`;
