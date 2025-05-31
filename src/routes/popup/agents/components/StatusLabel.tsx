import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { Text } from "@arconnect/components-rebrand";

export const StatusLabel = ({ status, label }: Props) => (
  <StatusWrapper align="center" gap=".5rem" success={status}>
    <StatusDot success={status} />
    <Text size="base" weight="medium" noMargin>
      {label}
    </Text>
  </StatusWrapper>
);

const StatusWrapper = styled(Flex)<{ success: boolean }>`
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
  background-color: ${(props) => (props.success ? "rgba(37, 51, 39, 1)" : "rgba(55, 35, 35, 1)")};
`;

const StatusDot = styled.div<{ success: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 100%;
  background-color: ${(props) => (props.success ? props.theme.success : props.theme.fail)};
`;

interface Props {
  status: boolean;
  label: string;
}
