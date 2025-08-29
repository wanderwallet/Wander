import { InformationIcon } from "@iconicicons/react";
import type { PropsWithChildren } from "react";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";

export const Info = ({ children }: PropsWithChildren<{}>) => (
  <Wrapper align="center" gap=".6rem">
    <InfoIcon />
    {children}
  </Wrapper>
);

const Wrapper = styled(Flex)`
  border: 1px solid ${(props) => props.theme.borderDefault};
  border-radius: 10px;
  padding: 0.65rem 0.6rem;
`;

const InfoIcon = styled(InformationIcon)`
  color: ${(props) => props.theme.secondaryText};
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
`;
