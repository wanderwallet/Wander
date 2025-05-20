import { PageType, trackPage } from "~utils/analytics";
import { useState, useEffect, useMemo, useCallback } from "react";
import styled from "styled-components";
import { Button, Input, Section, Spacer, Text, useInput, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import Token, { Logo, LogoAndDetails, TokenName, WarningIcon } from "~components/popup/Token";
import useSetting from "~settings/hook";
import { formatFiatBalance, formatTokenBalance, fractionedToBalance } from "~tokens/currency";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage, TempTransactionStorage } from "~utils/storage";
import { loadTokenLogo, type Token as TokenInterface } from "~tokens/token";
import { useTheme } from "~utils/theme";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import Collectible from "~components/popup/Collectible";
import { retryWithGateways } from "~gateways/wayfinder";
import { useLocation } from "~wallets/router/router.utils";
import HeadV2 from "~components/popup/HeadV2";
import SliderMenu from "~components/SliderMenu";
import { type Contact } from "~components/Recipient";
import { formatAddress } from "~utils/format";
import { useContact } from "~contacts/hooks";
import { defaultTokens, type TokenInfo } from "~tokens/aoTokens/ao";
import { useAoTokens } from "~tokens/hooks";
import BigNumber from "bignumber.js";
import { EXP_TOKEN } from "~utils/ao_import";
import { AnnouncementPopup } from "./announcement";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useTokenBalance, useTokenPrice, useTokenPrices } from "~tokens/hooks";
import Box from "~components/common/Box";
import { Flex } from "~components/common/Flex";
import { useActiveWallet } from "~wallets/hooks";
import { ChevronDown, Pencil01, SwitchVertical02 } from "@untitled-ui/icons-react";
import { SendInput } from "~components/SendInput";
import { HorizontalLine } from "~components/HorizontalLine";

enum AmountValidationState {
  Invalid = "Invalid",
  Insufficient = "Insufficient",
  Valid = "Valid",
  Empty = "Empty",
}

function validateAmount(
  amount: string,
  balance: string,
  networkFee: string = "0",
  qtyMode: QtyMode,
  price: string | number,
): AmountValidationState {
  if (amount.trim() === "") {
    return AmountValidationState.Empty;
  }

  const amountBN = new BigNumber(amount);
  const balanceBN = new BigNumber(balance);
  const networkFeeBN = new BigNumber(networkFee);
  const priceBN = new BigNumber(price);

  if (amountBN.isNaN() || amountBN.lte(0)) {
    return AmountValidationState.Invalid;
  }

  const amountInTokens = qtyMode === "fiat" ? amountBN.dividedBy(priceBN) : amountBN;

  if (amountInTokens.plus(networkFeeBN).gt(balanceBN)) {
    return AmountValidationState.Insufficient;
  }

  return AmountValidationState.Valid;
}

const getErrorMessage = (state: AmountValidationState) => {
  switch (state) {
    case AmountValidationState.Insufficient:
      return browser.i18n.getMessage("insufficient_balance");
    case AmountValidationState.Invalid:
      return browser.i18n.getMessage("invalid_amount");
    default:
      return "";
  }
};

export type RecipientType = {
  contact?: Contact;
  address: string;
};

export interface TransactionData {
  networkFee: string;
  estimatedFiat: string;
  qty: string;
  token: TokenInterface;
  estimatedNetworkFee: string;
  recipient: RecipientType;
  qtyMode: string;
  message?: string;
  isAo?: boolean;
}

export interface SendViewParams {
  id?: string;
  recipient?: string;
}

export type AmountViewProps = CommonRouteProps<SendViewParams>;

export function AmountView({ params: { id, recipient } }: AmountViewProps) {
  const { navigate, back } = useLocation();
  const theme = useTheme();
  const { setToast } = useToasts();

  const [isOpen, setOpen] = useState(true);

  // active address
  const wallet = useActiveWallet();

  // quantity
  const [qty, setQty] = useStorage<string>(
    {
      key: "last_send_qty",
      instance: ExtensionStorage,
    },
    "",
  );

  const [note] = useStorage<string>(
    {
      key: "last_send_note",
      instance: TempTransactionStorage,
    },
    "",
  );

  // qty mode (fiat/token)
  const [qtyMode, setQtyMode] = useStorage<QtyMode>(
    {
      key: "last_send_qty_mode",
      instance: ExtensionStorage,
    },
    "token",
  );

  // token that the user is going to send
  const [tokenID, setTokenID] = useStorage<"AR" | string>(
    {
      key: "last_send_token",
      instance: ExtensionStorage,
    },
    "AR",
  );

  // currency setting
  const [currency] = useSetting<string>("currency");

  // aoTokens
  const { tokens: assets } = useAoTokens({ type: "asset" });
  const { tokens: collectibles } = useAoTokens({ type: "collectible" });

  const { prices } = useTokenPrices(assets.map((t) => t.id).filter((id) => id !== "AR" && id !== EXP_TOKEN));

  // set ao for following page
  const [isAo, setIsAo] = useState<boolean>(false);

  const token = useMemo(() => {
    const matchingTokenInAoToken = [...assets, ...collectibles].find((aoToken) => aoToken.id === tokenID) || {
      ...defaultTokens[0],
      id: defaultTokens[0].processId,
    };

    setIsAo(matchingTokenInAoToken.id !== "AR");
    return {
      Denomination: matchingTokenInAoToken.Denomination,
      id: matchingTokenInAoToken.id,
      processId: matchingTokenInAoToken.id,
      Name: matchingTokenInAoToken.Name,
      Ticker: matchingTokenInAoToken.Ticker,
      type: matchingTokenInAoToken.type || "asset",
      Logo: matchingTokenInAoToken.Logo,
    };
  }, [tokenID, assets, collectibles]);

  const { data: balance = "0", isLoading } = useTokenBalance(token, wallet?.address);

  const degraded = useMemo(() => {
    if (isLoading) return false;

    return balance === null;
  }, [token, isLoading]);

  // if the ID is defined on mount, that means that
  // we need to reset the qty field
  useEffect(() => {
    if (!id) return;
    // setTokenID(id);
    // TODO: commented this to make sure we don't reset the qty
    // field when note is set and returned to amount page
    // setQty("");
  }, []);

  // token logo
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    (async () => {
      setLogo(await loadTokenLogo(token.processId, token.Logo, theme));
    })();
  }, [theme, token]);

  //arweave logo
  const arweaveLogo = useMemo(() => (theme === "light" ? arLogoLight : arLogoDark), [theme]);

  const contact = useContact(recipient);

  // token price
  const { price = "0" } = useTokenPrice(tokenID, currency);
  const tokenSearch = useInput();

  const filterFn = useCallback(
    (token: TokenInfo) => {
      const searchValue = tokenSearch.state?.toLowerCase();
      if (searchValue) {
        return token.Ticker.toLowerCase().includes(searchValue) || token.Name?.toLowerCase().includes(searchValue);
      }
      return true;
    },
    [tokenSearch.state],
  );

  // quantity in the other currency
  const secondaryQty = useMemo(() => {
    const qtyParsed = BigNumber(qty || "0");

    if (qtyMode === "token") return qtyParsed.multipliedBy(price);
    else return qtyParsed.dividedBy(price);
  }, [qty, qtyMode, price]);

  // network fee
  const [networkFee, setNetworkFee] = useState<string>("0");

  useEffect(() => {
    if (tokenID !== "AR") {
      setNetworkFee("0");
      return;
    }

    const calculateNetworkFee = async () => {
      try {
        let byte = 0;
        if (note) {
          byte = new TextEncoder().encode(note).byteLength;
        }

        const { result: txPrice, arweave } = await retryWithGateways((arweave) =>
          arweave.transactions.getPrice(byte, recipient),
        );

        if (tokenID === "AR") {
          setNetworkFee(arweave.ar.winstonToAr(txPrice));
        } else {
          setNetworkFee("0");
        }
      } catch (error) {
        console.error("Error calculating network fee:", error);
        setNetworkFee("0");
      }
    };

    const timeoutId = setTimeout(() => {
      calculateNetworkFee();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [tokenID, note, recipient]);

  // maximum possible send amount
  const max = useMemo(() => {
    const balanceBigNum = BigNumber(balance);
    const networkFeeBigNum = BigNumber(networkFee);
    const maxAmountToken = token.id === "AR" ? BigNumber.max(0, balanceBigNum.minus(networkFeeBigNum)) : balanceBigNum;

    return maxAmountToken.multipliedBy(qtyMode === "fiat" ? price : 1);
  }, [balance, token, networkFee, qtyMode]);

  // switch back to token qty mode if the
  // token does not have a fiat price
  useEffect(() => {
    if (!!+price) return;
    setQtyMode("token");
  }, [price]);

  // show token selector
  const [showTokenSelector, setShownTokenSelector] = useState(false);

  function updateSelectedToken(id: string) {
    setTokenID(id);
    setQty("");
    setShownTokenSelector(false);
  }

  // prepare tx to send
  async function send() {
    // check qty
    if (invalidQty || qty === "" || Number(qty) === 0) return;

    const finalQty = fractionedToBalance(
      qty,
      {
        id: token.id,
        decimals: token.Denomination,
      },
      token.id === "AR" ? "AR" : "AO",
    );

    await TempTransactionStorage.set("send", {
      networkFee,
      qty: qtyMode === "fiat" ? secondaryQty.toFixed() : qty,
      token,
      recipient: { address: recipient },
      estimatedFiat: qtyMode === "fiat" ? qty : secondaryQty.toFixed(),
      estimatedNetworkFee: BigNumber(networkFee).multipliedBy(price).toFixed(),
      message: note,
      qtyMode,
      isAo,
    });

    // continue to confirmation page
    navigate(`/send/confirm/${tokenID}/${finalQty}/${recipient}`);
  }

  const handleAddNote = () => {
    navigate(`/send/note`);
  };

  const amountValidationState = useMemo(() => {
    return validateAmount(qty, balance, networkFee, qtyMode, price);
  }, [qty, balance, networkFee, qtyMode, price]);

  // invalid qty
  const invalidQty = useMemo(() => {
    return (
      amountValidationState !== AmountValidationState.Valid && amountValidationState !== AmountValidationState.Empty
    );
  }, [amountValidationState]);

  useEffect(() => {
    if (recipient === wallet?.address) {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("cannot_send_to_self"),
        duration: 2400,
      });
      back();
    }
  }, [recipient, wallet?.address]);

  // Segment
  useEffect(() => {
    trackPage(PageType.SEND_AMOUNT);
  }, []);

  return (
    <>
      <HeadV2
        back={() => {
          TempTransactionStorage.removeItem("send");
          setQty("");
          back();
        }}
        title={browser.i18n.getMessage("select_amount")}
      />
      {EXP_TOKEN === tokenID && <AnnouncementPopup isOpen={isOpen} setOpen={setOpen} ticker={token.Ticker} />}
      <Wrapper showPaddingVertical={false} showOverlay={degraded}>
        <SendForm>
          {/* TOP INPUT */}
          {degraded && (
            <Degraded>
              <WarningWrapper>
                <WarningIcon color={theme === "dark" ? "#fff" : "#000"} />
              </WarningWrapper>
              <div>
                <h4>{browser.i18n.getMessage("ao_degraded")}</h4>
                <span>{browser.i18n.getMessage("ao_degraded_description").replace("<br/>", "")}</span>
              </div>
            </Degraded>
          )}
          <RecipientAmountWrapper>
            <Flex direction="column" gap={4}>
              <Flex gap={4}>
                <Text variant="secondary" weight="medium" noMargin>
                  From:
                </Text>
                <Text weight="medium" noMargin>
                  {wallet?.nickname} ({formatAddress(wallet?.address, 4)})
                </Text>
              </Flex>
              <Flex gap={4}>
                <Text variant="secondary" weight="medium" noMargin>
                  To:
                </Text>
                <Text weight="medium" noMargin>
                  {contact?.name
                    ? `${contact.name} (${formatAddress(recipient, 4)})`
                    : `${formatAddress(recipient, 4)}`}
                </Text>
              </Flex>
            </Flex>
            <Flex direction="column" gap={16}>
              <SendAmountInput
                type="number"
                placeholder={"0"}
                min={0}
                value={qty}
                status={invalidQty ? "error" : "default"}
                errorMessage={getErrorMessage(amountValidationState)}
                onChange={(e) => setQty((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || invalidQty || parseFloat(qty) === 0 || qty === "" || recipient === "")
                    return;
                  send();
                }}
                fullWidth
                iconRight={
                  <MaxButton disabled={degraded} onClick={() => setQty(max.toFixed())}>
                    MAX
                  </MaxButton>
                }
                ticker={qtyMode === "fiat" ? "USD" : token?.Ticker?.toUpperCase()}
                autoFocus
              />
              {!!+price && (
                <Flex
                  gap={10}
                  align="center"
                  cursor="pointer"
                  onClick={() => setQtyMode(qtyMode === "fiat" ? "token" : "fiat")}>
                  <SwitchIcon />
                  <Text variant="secondary" weight="medium" noMargin>
                    {qtyMode === "fiat" ? formatTokenBalance(secondaryQty) : formatFiatBalance(secondaryQty, currency)}
                    {qtyMode === "fiat" && " " + token.Ticker}
                  </Text>
                </Flex>
              )}
            </Flex>
          </RecipientAmountWrapper>
          <HorizontalLine />
          <Datas>
            <Text variant="secondary" size="sm" weight="medium" noMargin>
              ~{networkFee}
              {" AR "}
              {browser.i18n.getMessage("network_fee")}
            </Text>
          </Datas>
          <Flex direction="column" gap={8}>
            <AddNote as={Flex} gap={6} align="center" cursor="pointer" onClick={handleAddNote}>
              <Pencil01 />
              <Text variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage(note.length > 0 ? "edit_note" : "add_a_note")}
              </Text>
            </AddNote>
            <Text
              style={{
                height: 38,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              variant="secondary"
              size="sm"
              weight="medium"
              noMargin>
              {note}
            </Text>
          </Flex>
        </SendForm>
        <Spacer y={1} />
        <BottomActions>
          <TokenSelector onClick={() => setShownTokenSelector(true)}>
            <LogoAndDetails>
              <Logo src={logo || arweaveLogo} />
              <Flex direction="column" gap={2}>
                <TokenName>{token.type === "collectible" ? token.Name || token.Ticker : token.Ticker}</TokenName>
                <Text size="sm" weight="medium" variant="secondary" noMargin>
                  {balance} {token.Ticker}
                </Text>
              </Flex>
            </LogoAndDetails>
            <TokenSelectorRightSide>
              <ChevronDown />
            </TokenSelectorRightSide>
          </TokenSelector>

          <Button
            disabled={invalidQty || parseFloat(qty) === 0 || qty === "" || recipient === "" || EXP_TOKEN === tokenID}
            fullWidth
            onClick={send}>
            {browser.i18n.getMessage(qty ? "next" : "enter_amount")}
          </Button>
        </BottomActions>

        <SliderMenu
          height={"90%"}
          paddingVertical={32}
          title={browser.i18n.getMessage("select_token")}
          isOpen={showTokenSelector}
          onClose={() => {
            setShownTokenSelector(false);
          }}>
          <Input variant="search" sizeVariant="small" fullWidth placeholder="Search token" {...tokenSearch.bindings} />
          <Spacer y={1.5} />
          <TokensList>
            {assets.filter(filterFn).map((token) => (
              <Token
                key={token.id}
                type={"asset"}
                defaultLogo={token?.Logo}
                id={token.id}
                ticker={token.Ticker}
                divisibility={token.Denomination}
                fiatPrice={prices[token.id]}
                onClick={() => updateSelectedToken(token.id)}
              />
            ))}
          </TokensList>
          <Spacer y={1.25} />
          <CollectiblesList>
            {collectibles.filter(filterFn).map((token, i) => (
              <Collectible
                id={token.id}
                name={token.Name || token.Ticker}
                divisibility={token.Denomination}
                onClick={() => updateSelectedToken(token.id)}
                key={i}
              />
            ))}
          </CollectiblesList>
        </SliderMenu>
      </Wrapper>
    </>
  );
}

const RecipientAmountWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const MaxButton = styled.button`
  display: flex;
  text-align: center;
  align-items: center;
  justify-content: center;
  outline: none;
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme }) => theme.input.icons.searchActive};
  font-weight: 500;
  line-height: 130%;
`;

const Wrapper = styled(Section)<{
  showOverlay: boolean;
}>`
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;

  &::before {
    content: "";
    position: absolute; // Position the overlay
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(${(props) => props.theme.background}, 0.5);
    z-index: 10;
    display: ${({ showOverlay }) => (showOverlay ? "block" : "none")};
  }
`;

const SendForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: space-between;
`;

type QtyMode = "fiat" | "token";

// Make this dynamic
export const SendButton = styled(Button)<{ alternate?: boolean }>`
  background-color: ${(props) => props.alternate && "rgb(171, 154, 255, 0.15)"};
  border: 1px solid rgba(171, 154, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.alternate ? "space-between" : "center")};
  width: 100%;
  color: ${(props) => props.alternate && "#b9b9b9"};
  padding: 10px;
  font-weight: 400;

  &:hover:not(:active):not(:disabled) {
    box-shadow: 0 0 0 0.075rem rgba(${(props) => props.theme.theme}, 0.5);
    background-color: none;
  }
`;

export const SendAmountInput = styled(SendInput)`
  // remove counter
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const Degraded = styled.div`
  background: ${(props) => props.theme.backgroundSecondary};
  display: flex;
  margin: 0 0.9375rem;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.fail};
  position: relative;
  z-index: 11;
  border-radius: 0.625rem;

  h4 {
    font-weight: 500;
    font-size: 14px;
    margin: 0;
    padding: 0;
    font-size: inherit;
  }

  span {
    color: ${(props) => props.theme.secondaryTextv2};
    font-size: 12px;
  }
`;

export const WarningWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const BottomActions = styled(Box)`
  display: flex;
  width: 100%;
  gap: 1rem;
  flex-direction: column;
`;

const Datas = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-direction: column;
  justify-content: center;
`;

const TokenSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  border-radius: 8px;
  border: 1.5px solid ${(props) => props.theme.borderSecondary};
  background: ${(props) => props.theme.surfaceSecondary};

  /* xsmall shadow */
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06);
  transition: all 0.12s ease-;
  z-index: 20;

  &:active {
    transform: scale(0.97);
  }

  p {
    color: rgb(${(props) => props.theme.theme});
  }
`;

const TokenSelectorRightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 0.36rem;

  svg {
    font-size: 1.5rem;
    width: 1em;
    height: 1em;
    color: rgb(${(props) => props.theme.theme});
  }

  p {
    text-transform: uppercase;
    font-size: 0.7rem;
  }
`;

const TokensList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0;
  margin: 0;
`;

const CollectiblesList = styled(Section).attrs({
  showPaddingHorizontal: false,
})`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  padding-top: 0;

  &:empty {
    display: none;
  }
`;

const SwitchIcon = styled(SwitchVertical02)`
  color: ${(props) => props.theme.secondaryText};
  width: 20px;
  height: 20px;
`;

const AddNote = styled.div`
  color: ${(props) => props.theme.input.icons.searchActive};

  p {
    color: ${(props) => props.theme.input.icons.searchActive};
  }
`;
