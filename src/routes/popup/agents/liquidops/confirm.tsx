import HeadV2 from "~components/popup/HeadV2";
import { Button, Section, Text, Spacer, Input, useInput, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../components/SvgImage";
import { AgentStats } from "../components/liquidops/AgentStats";
import { useActiveWallet } from "~wallets/hooks";
import { tokenData, tokenInput } from "liquidops";
import { useLOSupplyAPY } from "./utils/hooks/useLOSupplyAPY";
import { useMemo, useState } from "react";
import type { CommonRouteProps } from "~wallets/router/router.types";
import BigNumber from "bignumber.js";
import { formatFiatBalance, formatTokenBalance } from "~tokens/currency";
import useSetting from "~settings/hook";
import { useTokenPrice } from "~tokens/hooks";
import { useOExchangeRate } from "./utils/hooks/useOExchangeRate";
import { useGateway } from "./utils/hooks/useGateway";
import { useLend } from "./utils/hooks/actions/useLend";
import { useLocation } from "~wallets/router/router.utils";
import { Quantity } from "ao-tokens";
import { useQueryClient } from "@tanstack/react-query";
import { checkPassword } from "~wallets/auth";

export type LiquidOpsConfirmProps = CommonRouteProps<{
  action: "deposit" | "withdraw";
  ticker: string;
  quantity: string;
}>;

export function LiquidOpsConfirm({ params: { action, ticker, quantity } }: LiquidOpsConfirmProps) {
  const { navigate } = useLocation();
  const queryClient = useQueryClient();

  const passwordInput = useInput();
  const wallet = useActiveWallet();

  const { lend, isLending, unlend, isUnlending } = useLend({
    onSettled: async (_, error) => {
      if (!error) {
        const { oTokenAddress, tokenAddress } = tokenInput(ticker.toUpperCase());

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["tokenBalance", oTokenAddress, wallet?.address],
          }),
          queryClient.invalidateQueries({
            queryKey: ["tokenBalance", tokenAddress, wallet?.address],
          }),
          queryClient.invalidateQueries({
            queryKey: ["assetBalance", tokenAddress, wallet?.address],
          }),
          queryClient.invalidateQueries({
            queryKey: ["liquidopsTokenAPY", ticker],
          }),
        ]);
      }

      navigate(`/agents/liquidops/${ticker}/${action}/result/${typeof error === "undefined" ? "success" : "failure"}`);
    },
  });

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const token = useMemo(
    () => activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [activeTokens, ticker],
  );
  const { data: tokenIconUrl } = useGateway(token.icon);

  const { data: supplyAPR } = useLOSupplyAPY(token.ticker);

  // performed action quantity in collateral
  const { data: exchangeRate = BigNumber(0) } = useOExchangeRate(token?.ticker, quantity);

  const quantityInCollateral = useMemo(() => {
    if (action === "deposit") {
      return BigNumber(quantity);
    } else {
      return exchangeRate;
    }
  }, [quantity, action, exchangeRate]);

  // withdraw fiat worth
  const [currency] = useSetting<string>("currency");
  const { price = 0 } = useTokenPrice(token.address, currency);

  const fiatWorth = useMemo(() => quantityInCollateral.multipliedBy(price), [quantityInCollateral]);

  // submit interaction
  const { setToast } = useToasts();

  const [checkingPassword, setCheckingPassword] = useState(false);
  const loading = useMemo(
    () => checkingPassword || isLending || isUnlending,
    [checkingPassword, isLending, isUnlending],
  );

  const submit = async () => {
    if (wallet.type === "hardware") {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("wallet_hardware_unsupported"),
        duration: 2400,
      });
    }

    // validate password
    try {
      setCheckingPassword(true);

      const checkPw = await checkPassword(passwordInput.state);
      if (!checkPw) {
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400,
        });
      }
    } catch {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2400,
      });
    } finally {
      setCheckingPassword(false);
    }

    // create and submit interaction
    const params = {
      token: token.ticker.toUpperCase(),
      quantity: new Quantity(0n, action === "deposit" ? token.baseDenomination : token.denomination).fromString(
        quantity,
      ).raw,
    };

    if (action === "deposit") {
      lend(params);
    } else if (action === "withdraw") {
      unlend(params);
    }
  };

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("confirm") + " " + browser.i18n.getMessage(action).toLowerCase()} />

      <Wrapper>
        <div>
          <Flex align="center" direction="column" gap={2}>
            <Text size="base" variant="secondary" weight="medium" noMargin>
              {browser.i18n.getMessage(action === "deposit" ? "depositing" : "withdrawing")}
            </Text>
            <Flex align="center" direction="column" gap={4}>
              <Flex align="baseline" gap={4}>
                <Flex align="baseline">
                  <Text size="5xl" weight="medium" noMargin>
                    {formatTokenBalance(quantityInCollateral)}
                  </Text>
                  <Text size="base" weight="medium" noMargin>
                    {ticker}
                  </Text>
                </Flex>
                <SvgImageWithBackground height={14} width={14} shape="circle" src={tokenIconUrl} iconSize={14} />
              </Flex>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {formatFiatBalance(fiatWorth, currency)}
              </Text>
            </Flex>
          </Flex>

          <Spacer y={1.1} />

          <AgentStats
            ticker={ticker}
            apy={action === "deposit" ? supplyAPR.toLocaleString(undefined, { maximumFractionDigits: 2 }) : undefined} // apy is not defined for withdrawals
            size={0}
            wanderFee={0} // TODO: talk to Clabs
            transactionFee={0} // this is 0 for now
          />

          <Flex direction="column" gap={12} padding="24px 0">
            <Text noMargin weight="medium">
              {browser.i18n.getMessage("sign_enter_password")}
            </Text>
            <Input
              placeholder={browser.i18n.getMessage("enter_password")}
              sizeVariant="small"
              {...passwordInput.bindings}
              type="password"
              fullWidth
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                submit();
              }}
            />
          </Flex>
        </div>

        <Button
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!passwordInput.state || passwordInput.state === "" || loading}
          onClick={submit}>
          {browser.i18n.getMessage(action)}
        </Button>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  justify-content: space-between;
  padding-top: 0px;
`;
