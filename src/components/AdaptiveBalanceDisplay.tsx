import { Text } from "@wanderapp/components";
import styled from "styled-components";
import { formatTokenBalance } from "~tokens/currency";
import { TokenLogo } from "~components/popup/TokenLogo";
import type { TokenInfo } from "~tokens/aoTokens/ao";

const Container = styled.div<{ isLongBalance: boolean }>`
  display: flex;
  flex-direction: ${({ isLongBalance }) => (isLongBalance ? "column" : "row")};
  justify-content: center;
  align-items: ${({ isLongBalance }) => (isLongBalance ? "center" : "baseline")};
  min-height: 48px;
`;

const Balance = styled.span<{ isLongBalance: boolean }>`
  color: ${({ theme }) => theme.primaryText};
  font-size: ${({ isLongBalance }) => (isLongBalance ? "24px" : "36px")};
  font-weight: 400;
  line-height: 120%;
  text-align: center;
`;

const TokenContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const Ticker = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
})``;

// TODO: This component should accept the same interfaces as TokenLogo

// TODO: Handle special state if there was an error loading the token?

export const AdaptiveBalanceDisplay: React.FC<{
  token?: TokenInfo | null;
  balance: string;
  ao: { isAo: boolean; tokenId?: string | null };
}> = ({ token, balance, ao }) => {
  const formattedBalance = !ao.isAo ? formatTokenBalance(balance || "0") : balance;

  const isLongBalance = formattedBalance.length > 8;

  return (
    <Container isLongBalance={isLongBalance}>
      <Balance isLongBalance={isLongBalance}>{formattedBalance}</Balance>
      <TokenContainer>
        <Ticker>{token?.Ticker || (ao.isAo ? "" : "AR")}</Ticker>
        <TokenLogo token={token || ""} size={16} />
      </TokenContainer>
    </Container>
  );
};
