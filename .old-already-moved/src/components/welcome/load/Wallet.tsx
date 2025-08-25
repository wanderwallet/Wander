import type { WalletInterface } from "./Migrate";
import { WalletIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import styled from "styled-components";

export default function Wallet({ address, label }: WalletInterface) {
  return (
    <Wrapper>
      <Icon />
      {formatAddress(address, 8)}
      {label && ` (${label})`}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.43rem;
  font-size: 0.92rem;
  font-weight: 500;
  color: rgb(${(props) => props.theme.secondaryText});
`;

const Icon = styled(WalletIcon)`
  font-size: 1.08rem;
  width: 1em;
  height: 1em;
`;
