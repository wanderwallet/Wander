import {
  decodeAccount,
  type KeystoneAccount
} from "~wallets/hardware/keystone";
import { addHardwareWallet } from "~wallets/hardware";
import { useScanner } from "@arconnect/keystone-sdk";
import {
  Alert,
  Icon as WarningIcon
} from "~components/auth/CustomGatewayWarning";
import { useState } from "react";
import {
  Modal,
  Spacer,
  Text,
  useModal,
  useToasts
} from "@arconnect/components";
import { Button } from "@arconnect/components-rebrand";
import AnimatedQRScanner from "./AnimatedQRScanner";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Progress from "../Progress";

export default function KeystoneButton({ onSuccess }: Props) {
  // toasts
  const { setToast } = useToasts();

  // connect modal
  const connectModal = useModal();

  // got scan result
  const [gotResult, setGotResult] = useState(false);

  // cancel scanning
  function cancel() {
    scanner.retry();
    connectModal.setOpen(false);
    setGotResult(false);
  }

  // qr-wallet scanner
  const scanner = useScanner(async (res) => {
    // if we already have a result
    // return
    if (gotResult) return;

    setGotResult(true);

    try {
      // load account data
      const account = await decodeAccount(res);

      // add wallet
      await addHardwareWallet(
        {
          address: account.address,
          publicKey: account.owner,
          xfp: account.xfp
        },
        "keystone"
      );

      setToast({
        type: "success",
        content: browser.i18n.getMessage("wallet_hardware_added", "Keystone"),
        duration: 2300
      });

      if (onSuccess) await onSuccess(account);
    } catch {
      setToast({
        type: "error",
        content: browser.i18n.getMessage(
          "wallet_hardware_not_added",
          "Keystone"
        ),
        duration: 2300
      });
    }

    cancel();
  });

  return (
    <>
      <Button
        fullWidth
        variant="secondary"
        onClick={() => connectModal.setOpen(true)}
        style={{ gap: "5px" }}
      >
        <KeystoneIcon />
        {browser.i18n.getMessage("keystone_connect_title")}
      </Button>
      <QRModal
        {...connectModal.bindings}
        root={document.getElementById("__plasmo")}
      >
        <ModalText heading>
          {browser.i18n.getMessage("keystone_connect_title")}
        </ModalText>
        <ModalContent>
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
          <Spacer y={1.75} />
          <FeatureAlert>
            <WarningIcon />
            {browser.i18n.getMessage("keystone_features_warning")}
          </FeatureAlert>
          <Spacer y={1} />
          <CancelButton onClick={cancel}>
            {browser.i18n.getMessage("cancel")}
          </CancelButton>
        </ModalContent>
      </QRModal>
    </>
  );
}

const KeystoneIcon = () => (
  <svg
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.0441 15.274C11.1533 15.3375 11.254 15.4147 11.3436 15.5036L14.9849 19.1178C15.7786 19.9056 15.7834 21.1876 14.9956 21.9813C14.9904 21.9865 14.9852 21.9917 14.98 21.9969L14.4436 22.5257C13.8899 23.0715 13.0548 23.2145 12.3511 22.884L8.33295 20.997C7.40486 20.5611 7.00582 19.4555 7.44167 18.5274C7.46477 18.4782 7.49002 18.43 7.51735 18.383L9.01351 15.811C9.42595 15.102 10.3351 14.8615 11.0441 15.274ZM12.6291 1.60946C12.7977 1.7068 12.9378 1.8466 13.0354 2.01493L13.7452 3.23787C14.08 3.81469 14.0796 4.52676 13.7443 5.10325L5.81069 18.7421C5.65288 19.0134 5.30503 19.1054 5.03374 18.9476C4.94924 18.8984 4.87885 18.8283 4.82938 18.744C4.5027 18.1874 4.25339 17.5889 4.08833 16.965L3.95917 16.4768C3.71712 15.5619 3.84691 14.5885 4.32021 13.7689L11.1074 2.01697C11.4151 1.48423 12.0964 1.30179 12.6291 1.60946ZM15.7801 7.13222C16.003 7.26191 16.1884 7.44743 16.3178 7.67052L17.8738 10.3514C18.2855 11.0608 18.0442 11.9697 17.3347 12.3815C17.1083 12.5129 16.8511 12.5821 16.5892 12.5821H13.1511C12.4334 12.5821 11.8515 12.0003 11.8515 11.2826C11.8515 11.053 11.9123 10.8276 12.0278 10.6291L13.7494 7.66927C14.1619 6.96023 15.071 6.71978 15.7801 7.13222Z"
      fill="currentColor"
    />
    <path
      d="M20.5178 14.9072C20.8723 15.5179 20.7686 16.2911 20.2657 16.7868L18.5353 18.4924C17.8832 19.1352 16.8352 19.1334 16.1853 18.4884L13.1309 15.4567C12.767 15.0956 12.7648 14.5078 13.126 14.144C13.3003 13.9684 13.5374 13.8696 13.7848 13.8696H18.7161C19.4586 13.8696 20.1451 14.2649 20.5178 14.9072Z"
      fill="currentColor"
    />
  </svg>
);

const QRModal = styled(Modal)`
  width: max-content;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ModalText = styled(Text)`
  text-align: center;
`;

const FeatureAlert = styled(Alert)`
  width: calc(400px + 24px - 2 * 1rem);

  @media screen and (max-width: 1080px) {
    width: calc(340px + 24px - 2 * 1rem);
  }

  @media screen and (max-width: 720px) {
    width: calc(100vw - 40px - 20px - 4px + 24px - 2 * 1rem);
  }
`;

const CancelButton = styled(Button).attrs({
  variant: "secondary",
  fullWidth: true
})`
  width: 100% !important;
`;

interface Props {
  onSuccess?: (account: KeystoneAccount) => any | Promise<any>;
}
