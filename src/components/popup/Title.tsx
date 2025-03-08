import { Text } from "@arconnect/components-rebrand";
import styled from "styled-components";

const Title = styled(Text)`
  font-weight: 500;
`;

export const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ViewAll = styled(Title).attrs({
  noMargin: true,
  variant: "secondary",
  size: "sm",
  weight: "medium"
})`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;

export default Title;
