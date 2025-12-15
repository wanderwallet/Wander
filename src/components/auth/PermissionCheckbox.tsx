import { Text } from "@wanderapp/components";
import styled from "styled-components";
import { ToggleSwitch } from "~components/ToggleSwitch";

const PermissionCheckbox = styled(ToggleSwitch)`
  align-items: flex-start;
`;

export const PermissionDescription = styled(Text).attrs({
  variant: "secondary",
  size: "sm",
  weight: "medium",
  noMargin: true,
})`
  margin-top: 0.2rem;
`;

export default PermissionCheckbox;
