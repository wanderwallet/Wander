import { Text } from "@arconnect/components-rebrand";
import type { GQLNodeInterface } from "ar-gql/dist/faces";
import styled from "styled-components";
import { formatTokenBalance } from "~tokens/currency";
import { Logo } from "./popup/Token";

const Container = styled.div<{ isLongBalance: boolean }>`
  display: flex;
  flex-direction: ${({ isLongBalance }) => (isLongBalance ? "column" : "row")};
  justify-content: center;
  align-items: ${({ isLongBalance }) =>
    isLongBalance ? "center" : "baseline"};
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
  weight: "medium"
})``;

const TokenLogo = styled(Logo)`
  width: 16px;
  height: 16px;
`;

export const AdaptiveBalanceDisplay: React.FC<{
  balance: string;
  ao: { isAo: boolean; tokenId?: string | null };
  ticker: string | null;
  logo?: string;
}> = ({ balance, ao, ticker, logo }) => {
  const formattedBalance = !ao.isAo
    ? formatTokenBalance(balance || "0")
    : balance;

  const isLongBalance = formattedBalance.length > 8;

  return (
    <Container isLongBalance={isLongBalance}>
      <Balance isLongBalance={isLongBalance}>{formattedBalance}</Balance>
      <TokenContainer>
        <Ticker>{ticker || "AR"}</Ticker>
        {logo && <TokenLogo src={logo} />}
      </TokenContainer>
    </Container>
  );
};
