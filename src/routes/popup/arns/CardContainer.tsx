import styled from "styled-components";
import { Card } from "@wanderapp/components";

export const CardContainer = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  margin: 1rem 0;
  background: ${(props) => props.theme.surfaceSecondary};
  border-radius: 12px;
  gap: 0.5rem;
`;
