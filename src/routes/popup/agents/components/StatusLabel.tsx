import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { Text, type DisplayTheme } from "@wanderapp/components";
import { useTheme } from "~utils/theme/theme.hook";

export const StatusLabel = ({ status, label }: Props) => {
  const { displayTheme } = useTheme();

  return (
    <StatusWrapper align="center" gap=".5rem" success={status} displayTheme={displayTheme}>
      <StatusDot success={status} />
      <Text size="base" weight="medium" noMargin>
        {label}
      </Text>
    </StatusWrapper>
  );
};

const colors = {
  success: {
    light: "244, 253, 245",
    dark: "37, 51, 39",
  },
  failure: {
    light: "255, 238, 237",
    dark: "55, 35, 35",
  },
};

const StatusWrapper = styled(Flex)<{ success: boolean; displayTheme: DisplayTheme }>`
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
  background-color: rgb(
    ${(props) => (props.success ? colors.success[props.displayTheme] : colors.failure[props.displayTheme])}
  );
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
