import {
  Button,
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import { ArrowRightIcon } from "@iconicicons/react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { SendButton, type RecipientType, type TransactionData } from ".";
import { formatAddress } from "~utils/format";
import type Transaction from "arweave/web/lib/transaction";
import { useStorage } from "~utils/storage";
import {
  ExtensionStorage,
  TempTransactionStorage,
  type RawStoredTransfer
} from "~utils/storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { findGateway, retryWithGateways } from "~gateways/wayfinder";
import Arweave from "arweave";
import { useLocation } from "~wallets/router/router.utils";
import { type Gateway } from "~gateways/gateway";
import AnimatedQRScanner from "~components/hardware/AnimatedQRScanner";
import AnimatedQRPlayer from "~components/hardware/AnimatedQRPlayer";
import { getActiveKeyfile, getActiveWallet, type StoredWallet } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { decryptWallet, freeDecryptedWallet } from "~wallets/encryption";
import { EventType, PageType, trackEvent, trackPage } from "~utils/analytics";
import { concatGatewayURL, getArweaveLink } from "~gateways/utils";
import type { JWKInterface } from "arbundles";
import {
  AutoContactPic,
  generateProfileIcon,
  ProfilePicture
} from "~components/Recipient";
import { formatFiatBalance, fractionedToBalance } from "~tokens/currency";
import { useContact } from "~contacts/hooks";
import {
  sendAoTransfer,
  sendAoTransferKeystone,
  useAo,
  type TokenInfo
} from "~tokens/aoTokens/ao";
import { useActiveWallet } from "~wallets/hooks";
import { UR } from "@ngraveio/bc-ur";
import {
  KeystoneSigner,
  decodeSignature,
  transactionToUR,
  type KeystoneInteraction
} from "~wallets/hardware/keystone";
import { useScanner } from "@arconnect/keystone-sdk";
import Progress from "~components/Progress";
import { updateSubscription } from "~subscriptions";
import { SubscriptionStatus } from "~subscriptions/subscription";
import { checkPassword } from "~wallets/auth";
import BigNumber from "bignumber.js";
import { SignType } from "@keystonehq/bc-ur-registry-arweave";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { AdaptiveBalanceDisplay } from "~components/AdaptiveBalanceDisplay";
import { useQueryClient } from "@tanstack/react-query";
import {
  TransactionDirection,
  FiatAmount,
  Properties,
  PropertyName,
  PropertyValue,
  TransactionProperty,
  AddContact
} from "../transaction/[id]";
import prettyBytes from "pretty-bytes";
import { stringToBuffer } from "arweave/web/lib/utils";
import useSetting from "~settings/hook";
import { Flex } from "~components/common/Flex";

export interface ConfirmViewParams {
  token: string;
  qty?: number;
  recipient?: string;
  message?: string;
  subscription?: boolean;
}

export type ConfirmViewProps = CommonRouteProps<ConfirmViewParams>;

export function ConfirmView({
  params: { token: tokenID, subscription }
}: ConfirmViewProps) {
  const { navigate } = useLocation();
  const queryClient = useQueryClient();

  // TODO: Need to get Token information
  const [token, setToken] = useState<TokenInfo | undefined>();
  const [amount, setAmount] = useState<string>("");

  const toastTimestamp = useRef<number | undefined>();

  const [isAo, setIsAo] = useState<boolean>(false);
  const passwordInput = useInput();
  const [estimatedFiatAmount, setEstimatedFiatAmount] = useState<string>("");
  const [networkFee, setNetworkFee] = useState<string>("");
  const [message, setMessage] = useState<string | undefined>();
  const [recipient, setRecipient] = useState<RecipientType | undefined>(
    undefined
  );
  const [logo, setLogo] = useState<string | undefined>();
  const { setToast } = useToasts();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const ao = useAo();
  const [currency] = useSetting("currency");

  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  const fromAddress = activeAddress;
  const toAddress = recipient?.address;
  const fromMe = wallets.find((wallet) => wallet.address === fromAddress);
  const toMe = wallets.find((wallet) => wallet.address === toAddress);
  const fromContact = useContact(activeAddress);
  const toContact = useContact(toAddress);

  const [transferRequirePassword] = useStorage<boolean>(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage
    },
    false
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: TransactionData = await TempTransactionStorage.get("send");
        if (data) {
          const estimatedFiatTotal = BigNumber(data.estimatedFiat)
            .plus(data.estimatedNetworkFee)
            .toFixed(2);
          setIsAo(data.isAo);
          setRecipient(data.recipient);
          setToken(data.token);
          setLogo(await getArweaveLink(data.token.Logo));
          setNetworkFee(data.networkFee);
          setAmount(data.qty);
          setEstimatedFiatAmount(data.estimatedFiat);

          //optional message state
          if (data.message) {
            setMessage(data.message);
          }
        } else {
          navigate("/send/transfer");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    trackPage(PageType.CONFIRM_SEND);
  }, []);

  const walletName = useMemo(() => {
    if (wallets && activeAddress) {
      const wallet = wallets.find(({ address }) => address === activeAddress);
      let name = wallet?.nickname || wallet?.address || "";
      return name.slice(0, 4);
    } else {
      return "";
    }
  }, [activeAddress]);

  const dataSize = useMemo(() => {
    const data = new Uint8Array(stringToBuffer(message));
    return prettyBytes(data.byteLength);
  }, [message]);

  async function prepare(
    target: string
  ): Promise<Partial<RawStoredTransfer> | void> {
    try {
      // create tx
      const { result: tx, gateway } = await retryWithGateways(
        async (arweave) => {
          const transaction = await arweave.createTransaction({
            target,
            quantity: fractionedToBalance(
              amount,
              { decimals: token.Denomination },
              "AR"
            ),
            data: message ? decodeURIComponent(message) : undefined
          });

          addTransferTags(transaction);
          return transaction;
        }
      );

      // save tx json into the session
      // to be signed and submitted
      const storedTx: Partial<RawStoredTransfer> = {
        type: tokenID === "AR" ? "native" : "token",
        gateway: gateway
      };

      storedTx.transaction = tx.toJSON();

      return storedTx;
    } catch {
      showTransferError();
    }
  }

  async function addTransferTags(transaction: Transaction) {
    if (message) {
      transaction.addTag("Content-Type", "text/plain");
    }
    transaction.addTag("Type", "Transfer");
    transaction.addTag("Client", "Wander");
    transaction.addTag("Client-Version", browser.runtime.getManifest().version);
  }

  function showTransferError() {
    if (toastTimestamp.current && Date.now() - toastTimestamp.current < 1000) {
      return;
    }

    toastTimestamp.current = Date.now();

    setToast({
      type: "error",
      content: (
        <Flex direction="column" gap={16}>
          <Text style={{ color: "#EEE" }} noMargin>
            {browser.i18n.getMessage("failed_tx_with_gateway")}
          </Text>
          <Button
            fullWidth
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL("tabs/dashboard.html#/gateways")
              })
            }
          >
            {browser.i18n.getMessage("switch_gateway")}
          </Button>
        </Flex>
      ),
      duration: 5000
    });
  }

  async function submitTx(
    transaction: Transaction,
    arweave: Arweave,
    type: "native" | "token"
  ) {
    // lorimer
    if (transaction.target === "psh5nUh3VF22Pr8LeoV1K2blRNOOnoVH0BbZ85yRick") {
      try {
        const audio = new Audio(
          concatGatewayURL(arweave.getConfig().api as Gateway) +
            "/xToXzqCyeh-1NXmRV0rYZa1rCtdjqESzrwDM5HbRnf0"
        );

        audio.play();
      } catch {}
    }

    // cache tx
    localStorage.setItem(
      "latest_tx",
      JSON.stringify({
        quantity: { ar: arweave.ar.winstonToAr(transaction.quantity) },
        owner: {
          address: await arweave.wallets.ownerToAddress(transaction.owner)
        },
        recipient: transaction.target,
        fee: { ar: transaction.reward },
        data: { size: transaction.data_size },
        // @ts-expect-error
        tags: (transaction.get("tags") as Tag[]).map((tag) => ({
          name: tag.get("name", { string: true, decode: true }),
          value: tag.get("value", { string: true, decode: true })
        }))
      })
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error("Timeout: Posting to Arweave took more than 10 seconds")
        );
      }, 10000);
    });

    try {
      await Promise.race([
        arweave.transactions.post(transaction),
        timeoutPromise
      ]);
    } catch (err) {
      // SEGMENT
      await trackEvent(EventType.TRANSACTION_INCOMPLETE, {});
      throw new Error("Error with posting to Arweave");
    }
  }

  async function sendLocal() {
    setIsLoading(true);
    const latestTxQty = await ExtensionStorage.get("last_send_qty");
    if (!latestTxQty) {
      setIsLoading(false);
      // setLoading(false);
      return setToast({
        type: "error",
        content: "No send quantity found",
        duration: 2000
      });
    }

    // Check PW
    if (transferRequirePassword) {
      const checkPw = await checkPassword(passwordInput.state);
      if (!checkPw) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400
        });
        setIsLoading(false);
        return;
      }
    }

    queryClient.invalidateQueries({
      queryKey: ["tokenBalance", tokenID, fromAddress]
    });
    queryClient.invalidateQueries({
      queryKey: ["tokenBalance", tokenID, toAddress]
    });

    // 2/21/24: Checking first if it's an ao transfer and will handle in this block
    if (isAo) {
      try {
        const res = await sendAoTransfer(
          ao,
          tokenID,
          recipient.address,
          fractionedToBalance(amount, { decimals: token.Denomination }, "AO")
        );
        if (res) {
          setToast({
            type: "success",
            content: browser.i18n.getMessage("sent_tx"),
            duration: 2000
          });
          navigate(`/send/completed/${res}?isAo=true`);
          setIsLoading(false);
        } else {
          throw new Error("Failed to send ao transfer");
        }
        return res;
      } catch (err) {
        console.log("err in ao", err);
        setIsLoading(false);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("failed_tx"),
          duration: 2000
        });
        return;
      }
    }
    // Prepare transaction
    const transactionAmount = BigNumber(latestTxQty);
    const prepared = await prepare(recipient.address);
    if (prepared) {
      let { gateway, transaction, type } = prepared;
      const arweave = new Arweave(gateway);

      const convertedTransaction = arweave.transactions.fromRaw(transaction);
      const decryptedWallet = await getActiveKeyfile();
      isLocalWallet(decryptedWallet);
      const keyfile = decryptedWallet.keyfile;

      if (!transferRequirePassword) {
        try {
          convertedTransaction.setOwner(keyfile.n);

          await arweave.transactions.sign(convertedTransaction, keyfile);

          try {
            await submitTx(convertedTransaction, arweave, type);
            subscription &&
              (await updateSubscription(
                activeAddress,
                recipient.address,
                SubscriptionStatus.ACTIVE
              ));
          } catch (e) {
            gateway = await findGateway({ random: true });
            const fallbackArweave = new Arweave(gateway);
            await fallbackArweave.transactions.sign(
              convertedTransaction,
              keyfile
            );
            await submitTx(convertedTransaction, fallbackArweave, type);
            await trackEvent(EventType.FALLBACK, {});
          }
          setIsLoading(false);
          setToast({
            type: "success",
            content: browser.i18n.getMessage("sent_tx"),
            duration: 2000
          });
          trackEvent(EventType.TX_SENT, {
            contact: toContact ? true : false,
            amount: tokenID === "AR" ? +transactionAmount : 0,
            fee: networkFee
          });
          // Redirect
          navigate(
            `/send/completed/${
              convertedTransaction.id
            }?back=${encodeURIComponent("/")}`
          );

          // remove wallet from memory
          freeDecryptedWallet(keyfile);
        } catch (e) {
          console.log(e);
          setIsLoading(false);
          freeDecryptedWallet(keyfile);
          showTransferError();
        }
      } else {
        const activeWallet = await getActiveWallet();
        if (activeWallet.type === "hardware") {
          return;
        }
        let keyfile: JWKInterface;
        try {
          keyfile = await decryptWallet(
            activeWallet.keyfile,
            passwordInput.state
          );
        } catch {
          freeDecryptedWallet(keyfile);
          setIsLoading(false);
          return setToast({
            type: "error",
            content: browser.i18n.getMessage("invalidPassword"),
            duration: 2000
          });
        }
        convertedTransaction.setOwner(keyfile.n);
        try {
          await arweave.transactions.sign(convertedTransaction, keyfile);
          try {
            await submitTx(convertedTransaction, arweave, type);
          } catch (e) {
            gateway = await findGateway({ random: true });
            const fallbackArweave = new Arweave(gateway);
            await fallbackArweave.transactions.sign(
              convertedTransaction,
              keyfile
            );
            await submitTx(convertedTransaction, fallbackArweave, type);
            await trackEvent(EventType.FALLBACK, {});
          }
          setIsLoading(false);
          setToast({
            type: "success",
            content: browser.i18n.getMessage("sent_tx"),
            duration: 2000
          });
          trackEvent(EventType.TX_SENT, {
            contact: toContact ? true : false,
            amount: tokenID === "AR" ? +transactionAmount : 0,
            fee: networkFee
          });
          navigate(
            `/send/completed/${
              convertedTransaction.id
            }?back=${encodeURIComponent("/")}`
          );
          freeDecryptedWallet(keyfile);
        } catch (e) {
          freeDecryptedWallet(keyfile);
          setIsLoading(false);
          showTransferError();
        }
      }
    }
  }

  /**
   * Hardware wallet functionalities
   */

  // current wallet
  const wallet = useActiveWallet();

  // load tx UR
  const [transactionUR, setTransactionUR] = useState<UR>();
  const [preparedTx, setPreparedTx] = useState<Partial<RawStoredTransfer>>();

  const keystoneInteraction = useMemo(() => {
    const keystoneInteraction: KeystoneInteraction = {
      display(data) {
        setIsLoading(false);
        setTransactionUR(data);
      }
    };
    return keystoneInteraction;
  }, [setIsLoading]);

  const keystoneSigner = useMemo(() => {
    if (wallet?.type !== "hardware") return null;
    const keystoneSigner = new KeystoneSigner(
      Buffer.from(Arweave.utils.b64UrlToBuffer(wallet.publicKey)),
      wallet.xfp,
      isAo ? SignType.DataItem : SignType.Transaction,
      keystoneInteraction
    );
    return keystoneSigner;
  }, [wallet, isAo, keystoneInteraction]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      if (!recipient?.address) {
        setIsLoading(false);
        return;
      }

      // get the tx from storage
      const prepared = await prepare(recipient.address);

      // redirect to transfer if the
      // transaction was not found
      if (!prepared || !prepared.transaction) {
        return navigate("/send/transfer");
      }

      // check if the current wallet
      // is a hardware wallet
      if (wallet?.type !== "hardware") {
        setIsLoading(false);
        return;
      }

      if (isAo) {
        try {
          setPreparedTx(prepared);
          const res = await sendAoTransferKeystone(
            ao,
            tokenID,
            recipient.address,
            fractionedToBalance(amount, { decimals: token.Denomination }, "AO"),
            keystoneSigner
          );
          if (res) {
            setToast({
              type: "success",
              content: browser.i18n.getMessage("sent_tx"),
              duration: 2000
            });
            navigate(`/send/completed/${res}?isAo=true`);
            setIsLoading(false);
          }
          return res;
        } catch (err) {
          console.log("err in ao", err);
          throw err;
        }
      }

      const arweave = new Arweave(prepared.gateway);
      const convertedTransaction = arweave.transactions.fromRaw(
        prepared.transaction
      );

      // get tx UR
      try {
        setIsLoading(false);
        setTransactionUR(
          await transactionToUR(
            convertedTransaction,
            wallet.xfp,
            wallet.publicKey
          )
        );
        setPreparedTx(prepared);
      } catch {
        setToast({
          type: "error",
          duration: 2300,
          content: browser.i18n.getMessage("transaction_auth_ur_fail")
        });
        navigate("/send/transfer");
      }
    })();
  }, [wallet, recipient?.address, keystoneSigner, amount]);

  // current hardware wallet operation
  const [hardwareStatus, setHardwareStatus] = useState<"play" | "scan">();

  // qr-tx scanner
  const scanner = useScanner(
    // handle scanner success,
    // post transfer
    async (res) => {
      try {
        if (!preparedTx) return;

        // get tx
        const { gateway, type } = preparedTx;
        const arweave = new Arweave(gateway);
        const transaction = arweave.transactions.fromRaw(
          preparedTx.transaction
        );

        // reset the prepared tx so we don't send it again
        setPreparedTx(undefined);

        if (!transaction) {
          throw new Error("Transaction undefined");
        }

        if (wallet?.type !== "hardware") {
          throw new Error("Wallet switched while signing");
        }

        // decode signature
        const { id, signature } = await decodeSignature(res);

        if (isAo) {
          keystoneSigner.submitSignature(signature);
          return;
        }

        // set signature
        transaction.setSignature({
          id,
          signature,
          owner: wallet.publicKey
        });

        // post tx
        await submitTx(transaction, arweave, type);

        setToast({
          type: "success",
          content: browser.i18n.getMessage("sent_tx"),
          duration: 2000
        });

        const latestTxQty = Number(
          (await ExtensionStorage.get("last_send_qty")) || "0"
        );
        trackEvent(EventType.TX_SENT, {
          contact: toContact ? true : false,
          amount: tokenID === "AR" ? latestTxQty : 0,
          fee: networkFee
        });
        navigate(
          `/send/completed/${transaction.id}?back=${encodeURIComponent("/")}`
        );
      } catch (e) {
        console.log(e);
        showTransferError();
      }
    }
  );

  return (
    <Wrapper>
      <HeadV2
        title={browser.i18n.getMessage(
          !subscription ? "confirm_transaction" : "subscription_payment"
        )}
        showOptions={false}
      />
      <ConfirmWrapper>
        <BodyWrapper>
          {hardwareStatus && (
            <AddressWrapper>
              <Address>
                {walletName}{" "}
                <Text variant="secondary" noMargin>
                  ({activeAddress && formatAddress(activeAddress, 4)})
                </Text>
              </Address>
              <ArrowRightIcon />
              <Address>
                {toContact && toContact.profileIcon ? (
                  <ProfilePicture size="22px" src={toContact.profileIcon} />
                ) : (
                  toContact && (
                    <AutoContactPic size="22px">
                      {generateProfileIcon(
                        toContact?.name || toContact.address
                      )}
                    </AutoContactPic>
                  )
                )}
                {toContact && toContact.name
                  ? toContact.name.slice(0, 8)
                  : recipient && formatAddress(recipient.address, 4)}
              </Address>
            </AddressWrapper>
          )}
          <div>
            {token && !hardwareStatus && (
              <>
                <Section
                  showPaddingHorizontal={false}
                  style={{
                    display: "flex",
                    paddingTop: 0,
                    flexDirection: "column",
                    gap: 8
                  }}
                >
                  <TransactionDirection>
                    {browser.i18n.getMessage("send")}
                  </TransactionDirection>

                  <AdaptiveBalanceDisplay
                    balance={amount}
                    ticker={token.Ticker || "AR"}
                    ao={{ isAo, tokenId: tokenID }}
                    logo={logo}
                  />
                  {!isNaN(parseFloat(estimatedFiatAmount)) && (
                    <FiatAmount>
                      {formatFiatBalance(estimatedFiatAmount, currency)}
                    </FiatAmount>
                  )}
                </Section>
                <Section
                  showPaddingVertical={false}
                  showPaddingHorizontal={false}
                >
                  <Properties>
                    <TransactionProperty>
                      <PropertyName>
                        {browser.i18n.getMessage("transaction_from")}
                      </PropertyName>
                      <PropertyValue>
                        <div>
                          {!fromContact ? (
                            <>
                              {formatAddress(fromMe || fromAddress, 6)}

                              {fromMe ? null : (
                                <AddContact>
                                  {browser.i18n.getMessage(
                                    "user_not_in_contacts"
                                  )}{" "}
                                  <span
                                    onClick={(e) => {
                                      e.preventDefault();

                                      trackEvent(EventType.ADD_CONTACT, {
                                        fromSendFlow: true
                                      });

                                      navigate(
                                        `/quick-settings/contacts/new?address=${fromAddress}`
                                      );
                                    }}
                                  >
                                    {browser.i18n.getMessage("create_contact")}
                                  </span>
                                </AddContact>
                              )}
                            </>
                          ) : (
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              {fromContact.profileIcon ? (
                                <ProfilePicture
                                  src={fromContact.profileIcon}
                                  size="19px"
                                />
                              ) : (
                                <AutoContactPic size="19px">
                                  {generateProfileIcon(
                                    fromContact?.name || fromContact.address
                                  )}
                                </AutoContactPic>
                              )}
                              {fromContact?.name ||
                                formatAddress(fromContact.address, 6)}
                            </div>
                          )}
                        </div>
                      </PropertyValue>
                    </TransactionProperty>
                    <TransactionProperty>
                      <PropertyName>
                        {browser.i18n.getMessage("transaction_to")}
                      </PropertyName>
                      <PropertyValue>
                        <div>
                          {!toContact ? (
                            <>
                              {formatAddress(toMe || toAddress, 6)}

                              {toMe ? null : (
                                <AddContact>
                                  {browser.i18n.getMessage(
                                    "user_not_in_contacts"
                                  )}{" "}
                                  <span
                                    onClick={(e) => {
                                      e.preventDefault();

                                      trackEvent(EventType.ADD_CONTACT, {
                                        fromSendFlow: true
                                      });

                                      navigate(
                                        `/quick-settings/contacts/new?address=${toAddress}`
                                      );
                                    }}
                                  >
                                    {browser.i18n.getMessage("create_contact")}
                                  </span>
                                </AddContact>
                              )}
                            </>
                          ) : (
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              {toContact.profileIcon ? (
                                <ProfilePicture
                                  src={toContact.profileIcon}
                                  size="19px"
                                />
                              ) : (
                                <AutoContactPic size="19px">
                                  {generateProfileIcon(
                                    toContact?.name || toContact.address
                                  )}
                                </AutoContactPic>
                              )}
                              {toContact?.name ||
                                formatAddress(toContact.address, 6)}
                            </div>
                          )}
                        </div>
                      </PropertyValue>
                    </TransactionProperty>
                    <TransactionProperty>
                      <PropertyName>
                        {browser.i18n.getMessage("transaction_fee")}
                      </PropertyName>
                      <PropertyValue>{networkFee} AR</PropertyValue>
                    </TransactionProperty>
                    {!message && (
                      <TransactionProperty>
                        <PropertyName>
                          {browser.i18n.getMessage("transaction_size")}
                        </PropertyName>
                        <PropertyValue>{dataSize}</PropertyValue>
                      </TransactionProperty>
                    )}
                  </Properties>
                </Section>
              </>
            )}
            {hardwareStatus === "play" && transactionUR && (
              <>
                <Description>
                  {browser.i18n.getMessage("sign_scan_qr")}
                </Description>
                <AnimatedQRPlayer data={transactionUR} />
              </>
            )}
            {hardwareStatus === "scan" && (
              <>
                <AnimatedQRScanner
                  {...scanner.bindings}
                  onError={(error) =>
                    setToast({
                      type: "error",
                      duration: 2300,
                      content: browser.i18n.getMessage(`keystone_${error}`)
                    })
                  }
                />
                <Spacer y={1} />
                <Text>
                  {browser.i18n.getMessage(
                    "keystone_scan_progress",
                    `${scanner.progress.toFixed(0)}%`
                  )}
                </Text>
                <Progress percentage={scanner.progress} />
              </>
            )}
          </div>
          {/* Password if Necessary */}
          {transferRequirePassword && (
            <PasswordWrapper>
              <Description>
                {browser.i18n.getMessage("sign_enter_password")}
              </Description>
              <Input
                placeholder={browser.i18n.getMessage("enter_password")}
                sizeVariant="small"
                {...passwordInput.bindings}
                type="password"
                fullWidth
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;

                  if (wallet.type === "local") await sendLocal();
                  else if (!hardwareStatus || hardwareStatus === "play") {
                    setHardwareStatus((val) =>
                      val === "play" ? "scan" : "play"
                    );
                  }
                }}
              />
            </PasswordWrapper>
          )}
        </BodyWrapper>
        <SendButton
          fullWidth
          disabled={
            (transferRequirePassword && !passwordInput.state) ||
            isLoading ||
            hardwareStatus === "scan"
          }
          onClick={async () => {
            if (wallet.type === "local") await sendLocal();
            else if (!hardwareStatus || hardwareStatus === "play") {
              setHardwareStatus((val) => (val === "play" ? "scan" : "play"));
            }
          }}
        >
          {(hardwareStatus === "play" &&
            browser.i18n.getMessage("keystone_scan")) ||
            browser.i18n.getMessage("next")}
        </SendButton>
      </ConfirmWrapper>
    </Wrapper>
  );
}

const PasswordWrapper = styled.div`
  display: flex;
  padding: 24px 0;
  flex-direction: column;
  gap: 12px;
`;

const Description = styled(Text).attrs({ noMargin: true, weight: "medium" })``;

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

type BodySectionProps = {
  title: string;
  subtitle?: string;
  value: string;
  ticker?: string;
  estimatedValue: string;
  alternate?: boolean;
};

export function BodySection({
  title,
  subtitle,
  value,
  ticker = "AR",
  estimatedValue,
  alternate
}: BodySectionProps) {
  return (
    <SectionWrapper alternate={alternate}>
      <Titles>
        {subtitle ? (
          <>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </>
        ) : (
          <h2>{title}</h2>
        )}
      </Titles>
      <Price>
        <ArAmount alternate={alternate}>
          {value}
          <p>{ticker}</p>
        </ArAmount>
        <ConvertedAmount>${estimatedValue}</ConvertedAmount>
      </Price>
    </SectionWrapper>
  );
}

const Titles = styled.div`
  p {
    margin: 0;
    padding: 0;
    color: #aeadcd;
  }
`;

const Wrapper = styled.div`
  height: calc(100vh - 100px);
  position: relative;
`;

export const ConfirmWrapper = styled(Section).attrs({
  showPaddingVertical: false
})`
  display: flex;
  justify-content: space-between;
  height: 100%;
  flex-direction: column;
`;

export const Address = styled.div`
  display: flex;
  background-color: ${(props) => props.theme.surfaceSecondary};
  border: 1px solid ${(props) => props.theme.borderSecondary};
  padding: 7px 4px;
  border-radius: 10px;
`;

export const AddressWrapper = styled.div`
  display: flex;
  font-size: 16px;
  color: ${(props) => props.theme.theme};
  font-weight: 500;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const SectionWrapper = styled.div<{ alternate?: boolean }>`
  display: flex;
  padding: 16px 0;
  align-items: start;
  justify-content: space-between;

  h2 {
    margin: 0;
    padding: 0;
    font-size: ${(props) => (props.alternate ? "16px" : "20px")};
    font-weight: 600;
    color: ${(props) => props.theme.theme};
  }

  :not(:last-child) {
    border-bottom: 1px solid ${(props) => props.theme.primary};
  }
`;

const Price = styled.div`
  display: flex;
  align-items: end;
  flex-direction: column;
`;

const ArAmount = styled.div<{ alternate?: boolean }>`
  display: inline-flex;
  flex-wrap: wrap;
  margin-left: auto;
  justify-content: flex-end;
  align-items: baseline;
  font-size: ${(props) => (props.alternate ? "16px" : "32px")};
  font-weight: 600;
  gap: 2px;
  p {
    line-height: 100%;
    font-size: ${(props) => (props.alternate ? "10px" : "14px")};
    font-weight: bold;
    color: ${(props) => props.theme.theme};
    margin: 0;
  }
`;

const ConvertedAmount = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #aeadcd;
`;
