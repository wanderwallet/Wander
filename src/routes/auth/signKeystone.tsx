import {
  dataItemToUR,
  decodeSignature,
  messageToUR
} from "~wallets/hardware/keystone";
import { useEffect, useState } from "react";
import { useScanner } from "@arconnect/keystone-sdk";
import { useActiveWallet } from "~wallets/hooks";
import type { UR } from "@ngraveio/bc-ur";
import {
  Section,
  Spacer,
  Text,
  useToasts
} from "@arconnect/components-rebrand";
import AnimatedQRScanner from "~components/hardware/AnimatedQRScanner";
import AnimatedQRPlayer from "~components/hardware/AnimatedQRPlayer";
import Wrapper from "~components/auth/Wrapper";
import Progress from "~components/Progress";
import browser from "webextension-polyfill";
import Message from "~components/auth/Message";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";

export function SignKeystoneAuthRequestView() {
  const { authRequest, acceptRequest, rejectRequest } =
    useCurrentAuthRequest("signKeystone");

  const { keystoneSignType, data: dataToSign } = authRequest;

  useEffect(() => {
    (async () => {
      if (keystoneSignType === "DataItem" && !!dataToSign) {
        await loadTransactionUR();
        setPage("qr");
      }
    })();
  }, [keystoneSignType, dataToSign]);

  /**
   * Hardware wallet logic
   */

  // current wallet
  const wallet = useActiveWallet();

  // current page
  const [page, setPage] = useState<"qr" | "scanner">();

  // load tx UR
  const [transactionUR, setTransactionUR] = useState<UR>();

  async function loadTransactionUR() {
    if (wallet.type !== "hardware" || !dataToSign) return;
    // load the ur data
    if (keystoneSignType === "DataItem") {
      const ur = await dataItemToUR(dataToSign, wallet.xfp);
      setTransactionUR(ur);
    } else {
      const ur = await messageToUR(dataToSign, wallet.xfp);
      setTransactionUR(ur);
    }
  }

  // loading
  const [loading, setLoading] = useState(false);

  // qr-tx scanner
  const scanner = useScanner(async (res) => {
    setLoading(true);

    try {
      // validation
      if (!dataToSign) {
        throw new Error("Transaction undefined");
      }

      if (wallet?.type !== "hardware") {
        throw new Error("Wallet switched while signing");
      }

      // decode signature
      const data = await decodeSignature(res);

      // reply
      await acceptRequest(data);
    } catch (e) {
      // log error
      console.error(
        `[Wander] Error decoding signature from keystone\n${e?.message || e}`
      );

      // reply to request
      await rejectRequest("Failed to decode signature from keystone");
    }

    setLoading(false);
  });

  // toast
  const { setToast } = useToasts();

  // TODO: Could large `data` values cause issues with this component or `<Message>` below?

  return (
    <Wrapper>
      <div>
        <HeadAuth title={browser.i18n.getMessage("titles_sign")} />
        <Spacer y={0.75} />
        {(!page && dataToSign && keystoneSignType === "Message" && (
          <Section>
            <Message message={[...dataToSign]} />
          </Section>
        )) || (
          <Section>
            <Text noMargin>{browser.i18n.getMessage("sign_scan_qr")}</Text>
            <Spacer y={1.5} />
            {(page === "qr" && <AnimatedQRPlayer data={transactionUR} />) || (
              <>
                <AnimatedQRScanner
                  {...scanner.bindings}
                  onError={(error) => {
                    setToast({
                      type: "error",
                      duration: 2300,
                      content: browser.i18n.getMessage(`keystone_${error}`)
                    });
                  }}
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
          </Section>
        )}
      </div>
      <Section>
        <AuthButtons
          authRequest={authRequest}
          primaryButtonProps={
            page === "scanner"
              ? undefined
              : {
                  label: browser.i18n.getMessage("sign_authorize"),
                  disabled: !dataToSign || loading,
                  loading: !dataToSign || loading,
                  onClick: async () => {
                    if (!dataToSign) return;
                    if (wallet.type === "hardware") {
                      // load tx ur
                      if (!page) await loadTransactionUR();

                      // update page
                      setPage((val) => (!val ? "qr" : "scanner"));
                    } else await acceptRequest();
                  }
                }
          }
          secondaryButtonProps={{
            onClick: () => rejectRequest()
          }}
        />
      </Section>
    </Wrapper>
  );
}
