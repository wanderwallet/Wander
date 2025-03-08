import { Text } from "@arconnect/components-rebrand";
import styled from "styled-components";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";

const PermissionCheckbox = styled(ToggleSwitch)`
  align-items: flex-start;
`;

export const PermissionDescription = styled(Text).attrs({
  variant: "secondary",
  size: "sm",
  weight: "medium",
  noMargin: true
})`
  margin-top: 0.2rem;
`;

export default PermissionCheckbox;
