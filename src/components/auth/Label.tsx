import { Text } from "@arconnect/components-rebrand";
import styled from "styled-components";

const Label = styled(Text).attrs({
  noMargin: true
})`
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 600;
`;

export default Label;
