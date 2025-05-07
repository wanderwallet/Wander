import styled from "styled-components";
import { useTheme } from "~utils/theme";
import { useLocation } from "~wallets/router/router.utils";
import dayjs from "dayjs";
import { SettingIconWrapper, SettingImage } from "~components/dashboard/list/BaseElement";
import { RecurringPaymentFrequency, SubscriptionStatus } from "~subscriptions/subscription";
import type { DisplayTheme } from "@arconnect/components";

export interface SubscriptionListItemProps {
  id: string;
  title: string;
  icon?: string;
  expiration: string | Date;
  status?: SubscriptionStatus;
  frequency: RecurringPaymentFrequency;
  amount: number;
}

export const SubscriptionListItem = ({ title, expiration, status, frequency, amount, id, icon }) => {
  const { navigate } = useLocation();
  const theme = useTheme();

  let period: string = "";
  const color: string = getColorByStatus(status as SubscriptionStatus);

  switch (frequency) {
    case "Weekly":
      period = "week";
      break;
    case "Monthly":
      period = "month";
      break;
    case "Daily":
      period = "day";
      break;
    case "Quarterly":
      period = "quarter";
      break;
    default:
      period = "";
  }

  return (
    <ListItem onClick={() => navigate(`/subscriptions/${id}`)}>
      <Content>
        <SettingIconWrapper bg={theme === "light" ? "235,235,235" : "255, 255, 255"} customSize="2rem">
          {icon && <SettingImage src={icon} />}
        </SettingIconWrapper>
        <ListDetails>
          <Title displayTheme={theme}>
            <h2>{title}</h2>
            <h3>Next payment date: {expiration ? <span>{dayjs(expiration).format("MMM DD, YYYY")} </span> : "--"}</h3>
          </Title>
          <SubscriptionInformation>
            <Status color={color}>
              <StatusCircle color={color} /> {status}
            </Status>
            <div>
              {amount} AR/{period}
            </div>
          </SubscriptionInformation>
        </ListDetails>
      </Content>
    </ListItem>
  );
};

export const getColorByStatus = (status: SubscriptionStatus): string => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "#14D110";
    case SubscriptionStatus.CANCELED:
      return "#FF1A1A";
    case SubscriptionStatus.AWAITING_PAYMENT:
      return "#CFB111";
    default:
      return "#A3A3A3";
  }
};

const StatusCircle = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
    <circle cx="3" cy="3" r="2.5" fill={color} />
  </svg>
);

export const Title = styled.div<{ displayTheme?: DisplayTheme }>`
  h3 {
    color: ${(props) => (props.displayTheme === "dark" ? "#a3a3a3" : "#757575")};

    span {
      color: white;
      color: ${(props) => (props.displayTheme === "dark" ? "white" : "#191919")};
    }
  }
`;

const ListItem = styled.div`
  padding: 10px 0;
  margin: 0 10px;

  &:not(:last-child) {
    border-bottom: 1px solid rgb(${(props) => props.theme.cardBorder});
  }
`;

const ListDetails = styled.div`
  display: flex;
  height: 100%;
  justify-content: space-between;
  width: 100%;
`;

const SubscriptionInformation = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 36px;
  text-align: right;
`;

const Status = styled.p<{ color: string }>`
  margin: 0;
  color: ${(props) => props.color};
  font-size: 10px;
`;

/*
const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;
*/

export const Content = styled.div`
  cursor: pointer;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  h2 {
    margin: 0;
    padding: 0;
    font-weight: 500;
    font-size: 1rem;
  }
  h3 {
    margin: 0;
    padding: 0;
    font-weight: 500;
    font-size: 10px;
  }
`;
