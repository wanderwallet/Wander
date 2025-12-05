import { balanceToFractioned, formatFiatBalance } from "~tokens/currency";
import { AnimatePresence, type Variants, motion } from "framer-motion";
import { Button, Section, Spacer, Text } from "@arconnect/components-rebrand";
import type { GQLNodeInterface, GQLTagInterface } from "ar-gql/dist/faces";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { STAKED_GQL_FULL_HISTORY, useGateway, useGraphqlGateways } from "~gateways/wayfinder";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import { concatGatewayURL, urlToGateway } from "~gateways/utils";
import { gql } from "~gateways/api";
import CustomGatewayWarning from "~components/auth/CustomGatewayWarning";
import Skeleton from "~components/Skeleton";
import CodeArea from "~components/CodeArea";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import prettyBytes from "pretty-bytes";
import styled from "styled-components";
import Arweave from "arweave";
import HeadV2 from "~components/popup/HeadV2";
import dayjs from "dayjs";
import { AutoContactPic, generateProfileIcon, ProfilePicture } from "~components/Recipient";
import { ExtensionStorage, TempTransactionStorage } from "~utils/storage";
import { useContact } from "~contacts/hooks";
import { EventType, PageType, trackEvent, trackPage } from "~utils/analytics";
import BigNumber from "bignumber.js";
import { useStorage } from "~utils/storage";
import type { StoredWallet } from "~wallets";
import type { WanderRoutePath, CommonRouteProps } from "~wallets/router/router.types";
import { ErrorTypes } from "~utils/error/error.utils";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import { AdaptiveBalanceDisplay } from "~components/AdaptiveBalanceDisplay";
import { useTokenPrice } from "~tokens/hooks";
import { fetchTokenByProcessId, getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { AO_AUTHORITY_ID, AR_TOKEN_INFO, AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { getPendingTransaction } from "~utils/transactions";
import { AO_LINK_URL } from "~constants/urls";

// need to manually set/replace tokenAddress here for ao interactions
interface ao {
  isAo: boolean;
  tokenId?: string | null;
}

export interface TransactionViewParams {
  id: string;
  // encodeURIComponent transformed gateway url
  gateway?: string;
  message?: boolean;
}

export type TransactionViewProps = CommonRouteProps<TransactionViewParams>;

export function TransactionView({ params: { id, gateway: gw, message } }: TransactionViewProps) {
  const { navigate, back } = useLocation();
  const { back: backPath, fromSend } = useSearchParams<{
    back?: string;
    fromSend?: boolean;
  }>();

  if (!id) {
    throw new Error(ErrorTypes.MissingTxId);
  }

  const [ao, setAo] = useState<ao>({ isAo: false });

  // fetch tx data
  const [transaction, setTransaction] = useState<GQLNodeInterface>();

  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage,
    },
    [],
  );

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const { isAo } = ao;

  const { fromAddress, toAddress, fromMe, toMe } = useMemo(() => {
    const ownerAddress = transaction?.owner.address;
    const fromAddress =
      isAo && ownerAddress === AO_AUTHORITY_ID
        ? getTagValue("From-Process", transaction?.tags || []) || ownerAddress
        : ownerAddress;
    const toAddress = transaction?.recipient;
    const fromMe = wallets.find((wallet) => wallet.address === fromAddress);
    const toMe = wallets.find((wallet) => wallet.address === toAddress);

    return {
      fromAddress,
      toAddress,
      fromMe,
      toMe,
    };
  }, [isAo, transaction]);

  // const [contact, setContact] = useState<any | undefined>(undefined);
  const fromContact = useContact(fromAddress);
  const toContact = useContact(toAddress);

  // arweave gateway
  const defaultGateway = useGateway(STAKED_GQL_FULL_HISTORY);
  const gateway = useMemo(() => {
    if (!gw) {
      return defaultGateway;
    }

    return urlToGateway(decodeURIComponent(gw));
  }, [gw, defaultGateway]);

  const graphqlGateways = useGraphqlGateways(5);

  // arweave client
  const arweave = useMemo(() => new Arweave(gateway), [gateway]);

  const transactionDirection = useMemo(() => {
    if (fromSend) return "Sent";

    if (!transaction || !activeAddress) return;

    const isAoTransaction = transaction.tags.some(
      (tag: GQLTagInterface) => tag.name === "Data-Protocol" && tag.value === "ao",
    );

    if (isAoTransaction) {
      const actionTag = transaction.tags.find((tag) => tag.name === "Action");
      if (actionTag?.value === "Transfer") {
        const recipientTag = transaction.tags.find((tag) => tag.name === "Recipient");
        if (recipientTag) {
          return recipientTag.value === activeAddress ? "Received" : "Sent";
        }
      }
    }

    if (!transaction.recipient) return;

    return transaction.owner.address === activeAddress ? "Sent" : "Received";
  }, [transaction, activeAddress, fromSend]);

  function handleDone() {
    navigate((backPath as WanderRoutePath) || "/");
  }

  const [showTags, setShowTags] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  useEffect(() => {
    if (!id || !graphqlGateways.length) return;

    let timeoutID: number | undefined;
    let fetchCount = 0;

    const fetchTx = async () => {
      let data: { transaction: GQLNodeInterface } | undefined;
      const cachedTx = await getPendingTransaction(id);
      if (cachedTx) {
        data = { transaction: cachedTx };
      }

      if (!data) {
        const gateway = graphqlGateways[fetchCount % graphqlGateways.length];

        ({ data } = await gql(
          `
          query($id: ID!) {
            transaction(id: $id) {
              owner {
                address
              }
              recipient
              fee {
                ar
              }
              data {
                size
                type
              }
              quantity {
                ar
              }
              tags {
                name
                value
              }
              block {
                height
                timestamp
              }
            }
          }
        `,
          { id },
          gateway,
        ));
      }

      if (!data?.transaction) {
        fetchCount++;
        timeoutID = window.setTimeout(fetchTx, 5000);
      } else {
        timeoutID = undefined;
        try {
          const dataProtocolTag = data.transaction.tags.find((tag) => tag.name === "Data-Protocol");
          if (dataProtocolTag && dataProtocolTag.value === "ao") {
            const isMintConfirmation = getTagValue("Action", data.transaction.tags) === "Mint-Confirmation";
            const tokenId = isMintConfirmation
              ? getTagValue("From-Process", data.transaction.tags) || data.transaction.recipient
              : data.transaction.recipient;
            setAo({ isAo: true, tokenId });

            const aoRecipient = getTagValue("Recipient", data.transaction.tags) || data.transaction.recipient;
            const aoQuantity =
              getTagValue("Quantity", data.transaction.tags) || getTagValue("Mint-Quantity", data.transaction.tags);

            if (aoQuantity) {
              const tokenInfo = await fetchTokenByProcessId(tokenId);

              if (tokenInfo) {
                const amount = balanceToFractioned(aoQuantity, {
                  id: data.transaction.recipient,
                  decimals: Number(tokenInfo.Denomination),
                });

                setTokenInfo(tokenInfo);

                data.transaction.quantity = {
                  ar: amount.toFixed(),
                  winston: "",
                };
                data.transaction.recipient = aoRecipient;
              } else {
                // TODO: Should this case ever happen?

                setTokenInfo(AR_TOKEN_INFO);

                const amount = balanceToFractioned(aoQuantity, {
                  id: data.transaction.recipient,
                  decimals: 0,
                });

                data.transaction.quantity = {
                  ar: amount.toFixed(),
                  winston: "",
                };
              }
            }
          } else {
            setTokenInfo(AR_TOKEN_INFO);
          }
        } catch (err) {
          console.error("Error fetching tx =", err);

          setTokenInfo(null);
        }

        setTransaction(data.transaction);
      }
    };

    fetchTx();
    trackPage(PageType.SEND_COMPLETE);

    return () => {
      if (timeoutID) clearTimeout(timeoutID);
    };
  }, [id, graphqlGateways]);

  // transaction confirmations
  const [confirmations, setConfirmations] = useState(0);

  useAsyncEffect(async () => {
    const status = await arweave.transactions.getStatus(id);

    setConfirmations(status.confirmed?.number_of_confirmations || 0);
  }, [id, arweave]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  const { price, hasPrice, loading } = useTokenPrice(ao.isAo ? ao.tokenId : AR_PROCESS_ID);

  // transaction price
  const fiatPrice = useMemo(() => {
    if (!hasPrice) return;
    const transactionQty = BigNumber(transaction?.quantity?.ar || "0");

    return transactionQty.multipliedBy(price);
  }, [transaction?.quantity?.ar, price, hasPrice]);

  // get content type
  const getContentType = () =>
    transaction?.data?.type || transaction?.tags?.find((t) => t.name.toLowerCase() === "content-type")?.value;

  // transaction data
  const [data, setData] = useState<string>("");

  const isBinary = useMemo(() => {
    const type = getContentType();

    if (!type) return false;

    return !type.startsWith("text/") && !type.startsWith("application/");
  }, [transaction]);

  const isPrintTx = useMemo(() => {
    return transaction?.tags?.some((tag) => tag.name === "Type" && tag.value === "Print-Archive");
  }, [transaction]);

  const isImage = useMemo(() => {
    const type = getContentType();

    return type && type.startsWith("image/");
  }, [transaction]);

  useAsyncEffect(async () => {
    if (!transaction || !id || !arweave || isBinary || isPrintTx) {
      return;
    }

    const type = getContentType();

    // return for null type
    if (!type) {
      return;
    }

    // load data
    let txData = await (await fetch(`${concatGatewayURL(gateway)}/${id}`)).text();

    // format json
    if (type === "application/json") {
      txData = JSON.stringify(JSON.parse(txData), null, 2);
    }

    setData(txData);
  }, [id, transaction, gateway, isBinary, isPrintTx]);

  // Clears out current transaction
  useAsyncEffect(async () => {
    await TempTransactionStorage.removeItem("send");
  }, []);

  // interaction input
  const input = useMemo(() => {
    const value = transaction?.tags?.find((tag) => tag.name === "Input")?.value;

    if (!value) return undefined;

    return JSON.parse(value);
  }, [transaction]);

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={browser.i18n.getMessage(message ? "message" : "transaction_details")}
          back={() => {
            // This is misleading and `backPath` is only used to indicate whether the back button actually navigates
            // back or goes straight to Home. This is because this page is also accessed from the Home > Transactions
            // tab items, which set `backPath = "/transactions"`, but pressing the back button would instead (but
            // correctly) navigate Home. Also, in the `else` block it looks like there are other options, but actually
            // there aren't; that branch always does `navigate("/")`:
            if (backPath === "/notifications" || backPath === "/transactions" || backPath === "/tier") {
              back();
            } else {
              navigate((backPath as WanderRoutePath) || "/");
            }
          }}
        />
        {(transaction && (
          <>
            {!message && (
              <>
                <Section
                  style={{
                    display: "flex",
                    paddingTop: 0,
                    flexDirection: "column",
                    gap: 8,
                  }}>
                  {transactionDirection && <TransactionDirection>{transactionDirection}</TransactionDirection>}
                  <AdaptiveBalanceDisplay token={tokenInfo} balance={transaction.quantity.ar} ao={ao} />
                  {hasPrice && !loading && <FiatAmount>{formatFiatBalance(fiatPrice, currency)}</FiatAmount>}
                </Section>
                <AnimatePresence>{gw && <CustomGatewayWarning simple />}</AnimatePresence>
              </>
            )}
            <Section showPaddingVertical={false}>
              <Properties>
                <TransactionProperty>
                  <PropertyName>{browser.i18n.getMessage("transaction_id")}</PropertyName>
                  <PropertyValue>{formatAddress(id, 6)}</PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>{browser.i18n.getMessage("transaction_from")}</PropertyName>
                  <PropertyValue>
                    <div>
                      {!fromContact ? (
                        <>
                          {formatAddress(fromMe || fromAddress, 6)}

                          {fromMe ? null : (
                            <AddContact>
                              {browser.i18n.getMessage("user_not_in_contacts")}{" "}
                              <span
                                onClick={(e) => {
                                  e.preventDefault();

                                  trackEvent(EventType.ADD_CONTACT, {
                                    fromSendFlow: true,
                                  });

                                  navigate(`/quick-settings/contacts/new?address=${fromAddress}`);
                                }}>
                                {browser.i18n.getMessage("create_contact")}
                              </span>
                            </AddContact>
                          )}
                        </>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {fromContact.profileIcon ? (
                            <ProfilePicture src={fromContact.profileIcon} size="19px" />
                          ) : (
                            <AutoContactPic size="19px">
                              {generateProfileIcon(fromContact?.name || fromContact.address)}
                            </AutoContactPic>
                          )}
                          {fromContact?.name || formatAddress(fromContact.address, 6)}
                        </div>
                      )}
                    </div>
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>{browser.i18n.getMessage("transaction_to")}</PropertyName>
                  <PropertyValue>
                    <div>
                      {!toContact ? (
                        <>
                          {formatAddress(toMe || toAddress, 6)}

                          {toMe ? null : (
                            <AddContact>
                              {browser.i18n.getMessage("user_not_in_contacts")}{" "}
                              <span
                                onClick={(e) => {
                                  e.preventDefault();

                                  trackEvent(EventType.ADD_CONTACT, {
                                    fromSendFlow: true,
                                  });

                                  navigate(`/quick-settings/contacts/new?address=${toAddress}`);
                                }}>
                                {browser.i18n.getMessage("create_contact")}
                              </span>
                            </AddContact>
                          )}
                        </>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {toContact.profileIcon ? (
                            <ProfilePicture src={toContact.profileIcon} size="19px" />
                          ) : (
                            <AutoContactPic size="19px">
                              {generateProfileIcon(toContact?.name || toContact.address)}
                            </AutoContactPic>
                          )}
                          {toContact?.name || formatAddress(toContact.address, 6)}
                        </div>
                      )}
                    </div>
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>{browser.i18n.getMessage("transaction_fee")}</PropertyName>
                  <PropertyValue>{transaction.fee?.ar || "0"} AR</PropertyValue>
                </TransactionProperty>
                {!message && (
                  <TransactionProperty>
                    <PropertyName>{browser.i18n.getMessage("transaction_size")}</PropertyName>
                    <PropertyValue>{prettyBytes(Number(transaction.data?.size || 0))}</PropertyValue>
                  </TransactionProperty>
                )}
                {transaction.block && (
                  <>
                    <TransactionProperty>
                      <PropertyName>{browser.i18n.getMessage("transaction_block_timestamp")}</PropertyName>
                      <PropertyValue>{dayjs(transaction.block.timestamp * 1000).format("MMM DD, YYYY")}</PropertyValue>
                    </TransactionProperty>
                    <TransactionProperty>
                      <PropertyName>{browser.i18n.getMessage("transaction_block_height")}</PropertyName>
                      <PropertyValue>
                        {"#"}
                        {transaction.block.height}
                      </PropertyValue>
                    </TransactionProperty>
                  </>
                )}
                <TransactionProperty>
                  <PropertyName>{browser.i18n.getMessage("transaction_confirmations")}</PropertyName>
                  <PropertyValue>{confirmations.toLocaleString()}</PropertyValue>
                </TransactionProperty>
                <PropertyName
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => setShowTags(!showTags)}>
                  {browser.i18n.getMessage("transaction_tags")}
                  {showTags ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </PropertyName>
                {showTags &&
                  transaction.tags.map(
                    (tag, i) =>
                      tag.name !== "Input" && (
                        <TransactionProperty key={i}>
                          <PropertyName>{tag.name}</PropertyName>
                          <TagValue>{tag.value}</TagValue>
                        </TransactionProperty>
                      ),
                  )}
                {input && (
                  <>
                    <Spacer y={0.1} />
                    <PropertyName>{browser.i18n.getMessage("transaction_input")}</PropertyName>
                    <CodeArea>{JSON.stringify(input, undefined, 2)}</CodeArea>
                  </>
                )}
                {(data || isBinary || isPrintTx) && (
                  <>
                    <Spacer y={0.1} />
                    <PropertyName
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}>
                      <a href={`${concatGatewayURL(gateway)}/${id}`} target="_blank" rel="noopener noreferrer">
                        {!message
                          ? browser.i18n.getMessage("transaction_data")
                          : browser.i18n.getMessage("signature_message")}
                        <DownloadIcon style={{ width: "18px", height: "18px" }} />
                      </a>
                    </PropertyName>
                    {!isPrintTx &&
                      ((!isImage && (
                        <CodeArea>
                          {(isBinary && browser.i18n.getMessage("transaction_data_binary_warning")) || data}
                        </CodeArea>
                      )) || <ImageDisplay src={`${concatGatewayURL(gateway)}/${id}`} />)}
                  </>
                )}
              </Properties>
            </Section>
          </>
        )) || (
          <>
            <Section showPaddingVertical={false}>
              <FiatAmount>
                <Skeleton width="3rem" />
              </FiatAmount>
              <AmountTitle>
                <Skeleton width="6rem" />
              </AmountTitle>
            </Section>
            <Section showPaddingVertical={false}>
              <Properties>
                {new Array(7).fill("").map((_, i) => (
                  <TransactionProperty key={i}>
                    <PropertyName>
                      <Skeleton width="7.2rem" />
                    </PropertyName>
                    <PropertyValue>
                      <Skeleton width="7.2rem" />
                    </PropertyValue>
                  </TransactionProperty>
                ))}
                <Spacer y={0.1} />
                <PropertyName>
                  <Skeleton width="4.8rem" />
                </PropertyName>
                <Spacer y={0.05} />
                {new Array(3).fill("").map((_, i) => (
                  <TransactionProperty key={i}>
                    <PropertyName>
                      <Skeleton width="7.2rem" />
                    </PropertyName>
                    <PropertyValue>
                      <Skeleton width="7.2rem" />
                    </PropertyValue>
                  </TransactionProperty>
                ))}
              </Properties>
            </Section>
          </>
        )}
      </div>
      <AnimatePresence>
        {id && transaction && (
          <motion.div variants={opacityAnimation} initial="hidden" animate="shown" exit="hidden">
            <Section style={{ gap: 12 }}>
              {fromSend && (
                <Button fullWidth onClick={handleDone}>
                  {browser.i18n.getMessage("done")}
                </Button>
              )}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const url = ao.isAo ? `${AO_LINK_URL}/#/message/${id}` : `https://viewblock.io/arweave/tx/${id}`;

                  browser.tabs.create({ url });
                }}>
                {ao.isAo ? "AOLink" : "Viewblock"}
                <LinkExternal02 height={24} width={24} style={{ marginLeft: "8px" }} />
              </Button>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

export const useAdjustAmountTitleWidth = (
  parentRef: MutableRefObject<any>,
  childRef: MutableRefObject<any>,
  quantity: string,
) => {
  const canvasRef = useRef(null);

  if (!canvasRef.current) {
    canvasRef.current = document.createElement("canvas");
  }

  const measureTextWidth = useCallback((text: string, font: string): number => {
    const context = canvasRef.current.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }, []);

  function adjustAmountFontSize() {
    if (!quantity || !parentRef.current || !childRef.current) return;

    const parentWidth = parentRef.current.offsetWidth;
    const style = getComputedStyle(childRef.current);
    const font = `${style.fontSize} ${style.fontFamily}`;
    const childWidth = measureTextWidth(quantity, font);

    if (childWidth / parentWidth > 0.85) {
      const newFontSize = parentWidth * 0.05;
      childRef.current.style.fontSize = `${newFontSize}px`;
      childRef.current.children[0].style.fontSize = `0.75rem`;
    } else {
      // default font sizes
      childRef.current.style.fontSize = `2.5rem`;
      childRef.current.children[0].style.fontSize = `1.25rem`;
    }
  }

  useEffect(() => {
    adjustAmountFontSize();

    window.addEventListener("resize", adjustAmountFontSize);

    return () => window.removeEventListener("resize", adjustAmountFontSize);
  }, [quantity]);
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

export const FiatAmount = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  variant: "secondary",
  size: "sm",
})`
  text-align: center;

  ${Skeleton} {
    margin: 0 auto 0.3em;
  }
`;

export const AddContact = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${(props) => props.theme.primaryText};
  margin: 0;

  span {
    cursor: pointer;
    color: #ab9aff;
    padding: 0;
  }
`;

export const TransactionDirection = styled(Text).attrs({
  weight: "medium",
  variant: "secondary",
  noMargin: true,
})`
  text-align: center;
`;

export const AmountTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: ${(props) => props.theme.primaryText};
  text-align: center;
  margin: 0;
  line-height: 1.1em;

  span {
    text-transform: uppercase;
    font-size: 1.25rem;
    margin-left: 0.34rem;
  }

  ${Skeleton} {
    margin: 0 auto;
  }
`;

export const Properties = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const TransactionProperty = styled.div`
  display: flex;
  justify-content: space-between;
`;

const BasePropertyText = styled(Text).attrs({
  noMargin: true,
})`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.95rem;

  a {
    display: flex;
    color: inherit;
    text-decoration: none;

    svg {
      font-size: 1em;
      width: 1em;
      height: 1em;
    }
  }
`;

export const PropertyName = styled(BasePropertyText).attrs({
  size: "sm",
  weight: "medium",
  variant: "secondary",
})`
  display: flex;
  align-items: start;
`;

export const PropertyValue = styled(BasePropertyText).attrs({
  size: "sm",
  weight: "medium",
})`
  text-align: right;
`;

export const TagValue = styled(PropertyValue)`
  max-width: 50%;
  overflow-y: scroll;
  white-space: nowrap;

  /* Hide Scrollbar */
  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */
  &::-webkit-scrollbar {
    display: none; /* For Chrome, Safari, and Opera */
  }
`;

const ImageDisplay = styled.img.attrs({
  draggable: false,
  alt: "Transaction data",
})`
  width: 100%;
  user-select: none;
`;

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};
