import {
  type RawStoredTransfer,
  TempTransactionStorage,
  TRANSFER_TX_STORAGE,
  ExtensionStorage
} from "~utils/storage";
import { concatGatewayURL } from "~gateways/utils";
import { decodeSignature, transactionToUR } from "~wallets/hardware/keystone";
import { decryptWallet, freeDecryptedWallet } from "~wallets/encryption";
import { ArrowRightIcon, ArrowUpRightIcon } from "@iconicicons/react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import type { Tag } from "arweave/web/lib/transaction";
import { useScanner } from "@arconnect/keystone-sdk";
import { useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { useEffect, useState } from "react";
import { getActiveKeyfile, getActiveWallet } from "~wallets";
import type { UR } from "@ngraveio/bc-ur";
import {
  Button,
  Input,
  Loading,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import AnimatedQRScanner from "~components/hardware/AnimatedQRScanner";
import AnimatedQRPlayer from "~components/hardware/AnimatedQRPlayer";
import type Transaction from "arweave/web/lib/transaction";
import Progress from "~components/Progress";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";
import Arweave from "arweave";
import { defaultGateway, type Gateway } from "~gateways/gateway";
import { EventType, trackEvent } from "~utils/analytics";
import BigNumber from "bignumber.js";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useStorage } from "@plasmohq/storage/hook";
import { findGateway } from "~gateways/wayfinder";

export interface SendAuthViewParams {
  tokenID?: string;
}

export type SendAuthViewProps = CommonRouteProps<SendAuthViewParams>;

export function SendAuthView({ params: { tokenID } }: SendAuthViewProps) {
  const { navigate } = useLocation();

  // loading
  const [loading, setLoading] = useState(false);

  const [transferRequirePassword] = useStorage(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage
    },
    false
  );

  // password input
  const passwordInput = useInput();

  // get transaction from session storage
  async function getTransaction() {
    // get raw tx
    const raw = await TempTransactionStorage.get<RawStoredTransfer>(
      TRANSFER_TX_STORAGE
    );
    const gateway = raw?.gateway || defaultGateway;

    if (!raw) return undefined;

    // gateway from raw tx
    const arweave = new Arweave(gateway);

    return {
      type: raw.type,
      gateway,
      transaction: arweave.transactions.fromRaw(raw.transaction)
    };
  }

  /**
   * Submit transaction to the network
   *
   * @param transaction
   * @param arweave
   * @param type
   */
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

  // toasts
  const { setToast } = useToasts();

  /**
   * Local wallet functionalities
   */

  // local wallet sign & send
  async function sendLocal() {
    setLoading(true);

    // Retrieve latest tx amount details from localStorage
    const latestTxQty = await ExtensionStorage.get("last_send_qty");
    if (!latestTxQty) {
      setLoading(false);
      return setToast({
        type: "error",
        content: "No send quantity found",
        duration: 2000
      });
    }

    const transactionAmount = BigNumber(latestTxQty);

    // get tx and gateway
    let { type, gateway, transaction } = await getTransaction();
    const arweave = new Arweave(gateway);

    const decryptedWallet = await getActiveKeyfile();

    if (decryptedWallet.type === "hardware") {
      return setLoading(false);
    }

    // If password is not required, process transaction without user signing
    if (!transferRequirePassword) {
      // Process transaction without user signing
      try {
        // Decrypt wallet without user input
        const keyfile = decryptedWallet.keyfile;

        // Set owner
        transaction.setOwner(keyfile.n);

        // Sign the transaction
        await arweave.transactions.sign(transaction, keyfile);

        try {
          // Post the transaction
          await submitTx(transaction, arweave, type);
        } catch (e) {
          // FALLBACK IF ISP BLOCKS the gateway or if the gateway fails
          gateway = await findGateway({ random: true });
          const fallbackArweave = new Arweave(gateway);
          await fallbackArweave.transactions.sign(transaction, keyfile);
          await submitTx(transaction, fallbackArweave, type);
          await trackEvent(EventType.FALLBACK, {});
        }

        // Success toast
        setToast({
          type: "success",
          content: browser.i18n.getMessage("sent_tx"),
          duration: 2000
        });

        // Redirect
        navigate(
          `/transaction/${transaction.id}?back=${encodeURIComponent("/")}`
        );

        // remove wallet from memory
        freeDecryptedWallet(keyfile);
      } catch (e) {
        console.log(e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("failed_tx"),
          duration: 2000
        });
      }
    } else {
      // decrypt wallet
      const activeWallet = await getActiveWallet();

      if (activeWallet.type === "hardware") {
        return setLoading(false);
      }

      let keyfile: JWKInterface;

      try {
        keyfile = await decryptWallet(
          activeWallet.keyfile,
          passwordInput.state
        );
      } catch {
        setLoading(false);
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2000
        });
      }

      // set owner
      transaction.setOwner(keyfile.n);

      try {
        // sign
        await arweave.transactions.sign(transaction, keyfile);

        try {
          // post tx
          await submitTx(transaction, arweave, type);
        } catch (e) {
          // FALLBACK IF ISP BLOCKS the gateway or if the gateway fails
          gateway = await findGateway({ random: true });
          const fallbackArweave = new Arweave(gateway);
          await fallbackArweave.transactions.sign(transaction, keyfile);
          await submitTx(transaction, fallbackArweave, type);
          await trackEvent(EventType.FALLBACK, {});
        }

        setToast({
          type: "success",
          content: browser.i18n.getMessage("sent_tx"),
          duration: 2000
        });

        navigate(
          `/transaction/${transaction.id}?back=${encodeURIComponent("/")}`
        );

        // remove wallet from memory
        freeDecryptedWallet(keyfile);
      } catch (e) {
        console.log(e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("failed_tx"),
          duration: 2000
        });
      }
    }

    setLoading(false);
  }

  /**
   * Hardware wallet functionalities
   */

  // current wallet
  const wallet = useActiveWallet();

  // load tx UR
  const [transactionUR, setTransactionUR] = useState<UR>();

  useEffect(() => {
    (async () => {
      // get the tx from storage
      const { transaction } = await getTransaction();

      // redirect to transfer if the
      // transaction was not found
      if (!transaction) {
        return navigate("/send/transfer");
      }

      // check if the current wallet
      // is a hardware wallet
      if (wallet?.type !== "hardware") return;

      // get tx UR
      try {
        setTransactionUR(
          await transactionToUR(transaction, wallet.xfp, wallet.publicKey)
        );
      } catch {
        setToast({
          type: "error",
          duration: 2300,
          content: browser.i18n.getMessage("transaction_auth_ur_fail")
        });
        navigate("/send/transfer");
      }
    })();
  }, [wallet]);

  // current hardware wallet operation
  const [hardwareStatus, setHardwareStatus] = useState<"play" | "scan">("play");

  // qr-tx scanner
  const scanner = useScanner(
    // handle scanner success,
    // post transfer
    async (res) => {
      setLoading(true);

      try {
        // get tx
        const { transaction, gateway, type } = await getTransaction();
        const arweave = new Arweave(gateway);

        if (!transaction) {
          throw new Error("Transaction undefined");
        }

        if (wallet?.type !== "hardware") {
          throw new Error("Wallet switched while signing");
        }

        // decode signature
        const { id, signature } = await decodeSignature(res);

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

        navigate(
          `/transaction/${transaction.id}?back=${encodeURIComponent("/")}`
        );
      } catch (e) {
        console.log(e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("failed_tx"),
          duration: 2000
        });
      }

      setLoading(false);
    }
  );

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("titles_sign")} />
        <Spacer y={0.75} />
        {wallet && (
          <Section>
            <Text noMargin>
              {wallet.type === "local" &&
                browser.i18n.getMessage("sign_enter_password")}
              {wallet.type === "hardware" &&
                browser.i18n.getMessage("sign_scan_qr")}
            </Text>
            <Spacer y={1.5} />
            {(wallet.type === "local" && (
              <Input
                type="password"
                {...passwordInput.bindings}
                label={browser.i18n.getMessage("password")}
                placeholder={browser.i18n.getMessage("enter_password")}
                fullWidth
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  sendLocal();
                }}
                autoFocus
              />
            )) ||
              (hardwareStatus === "scan" && (
                <>
                  {(!loading && (
                    <>
                      <AnimatedQRScanner
                        {...scanner.bindings}
                        onError={(error) =>
                          setToast({
                            type: "error",
                            duration: 2300,
                            content: browser.i18n.getMessage(
                              `keystone_${error}`
                            )
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
                  )) || (
                    <SendLoading>
                      <Loading />
                      <LoadingText>
                        {browser.i18n.getMessage("transaction_send_loading")}
                      </LoadingText>
                    </SendLoading>
                  )}
                </>
              )) ||
              (transactionUR && <AnimatedQRPlayer data={transactionUR} />)}
          </Section>
        )}
      </div>
      {wallet && (
        <Section>
          {(wallet.type === "local" && (
            <Button
              disabled={passwordInput.state === ""}
              loading={loading}
              fullWidth
              onClick={sendLocal}
            >
              {browser.i18n.getMessage("send")}
              <ArrowUpRightIcon />
            </Button>
          )) ||
            (hardwareStatus === "play" && (
              <Button fullWidth onClick={() => setHardwareStatus("scan")}>
                {browser.i18n.getMessage("next")}
                <ArrowRightIcon />
              </Button>
            ))}
        </Section>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
`;

const SendLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgb(${(props) => props.theme.secondaryText});
  gap: 0.7rem;

  svg {
    width: 2rem;
    height: 2rem;
  }
`;

const LoadingText = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
