import {
  Button,
  Input,
  Modal,
  Spacer,
  Text,
  Tooltip,
  useInput,
  useModal,
  useToasts
} from "@arconnect/components-rebrand";
import { CopyIcon, DownloadIcon, TrashIcon } from "@iconicicons/react";
import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { removeWallet, type StoredWallet } from "~wallets";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "~utils/storage";
import { IconButton } from "~components/IconButton";
import { decryptWallet, freeDecryptedWallet } from "~wallets/encryption";
import { ExtensionStorage } from "~utils/storage";
import { downloadKeyfile } from "~utils/file";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { formatAddress } from "~utils/format";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { LoadingView } from "~components/page/common/loading/loading.view";
import { getNameServiceProfile } from "~lib/nameservice";

export interface WalletSettingsDashboardViewParams {
  address: string;
}

export type WalletSettingsDashboardViewProps =
  CommonRouteProps<WalletSettingsDashboardViewParams>;

export function WalletSettingsDashboardView({
  params: { address }
}: WalletSettingsDashboardViewProps) {
  // wallets
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  // this wallet
  const wallet = useMemo(
    () => wallets?.find((w) => w.address === address),
    [wallets, address]
  );

  // toasts
  const { setToast } = useToasts();

  // name service name
  const [nameServiceName, setNameServiceName] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!wallet) return;

      const nameServiceProfile = await getNameServiceProfile(wallet.address);
      setNameServiceName(nameServiceProfile?.name);
    })();
  }, [wallet?.address]);

  // wallet name input
  const walletNameInput = useInput();

  useEffect(() => {
    if (!wallet) return;
    walletNameInput.setState(nameServiceName || wallet.nickname);
  }, [wallet, nameServiceName]);

  // update nickname function
  async function updateNickname() {
    if (!!nameServiceName) return;

    // check name
    const newName = walletNameInput.state;

    if (!newName || newName === "") {
      return setToast({
        type: "error",
        content: "Please enter a valid nickname",
        duration: 2200
      });
    }

    // update wallets
    try {
      await setWallets((val) =>
        val.map((wallet) => {
          if (wallet.address !== address) {
            return wallet;
          }

          return {
            ...wallet,
            nickname: newName
          };
        })
      );

      setToast({
        type: "info",
        content: browser.i18n.getMessage("updated_wallet_name"),
        duration: 3000
      });
    } catch (e) {
      console.log("Could not update nickname", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_updating_wallet_name"),
        duration: 3000
      });
    }
  }

  // wallet remove modal
  const removeModal = useModal();

  // export wallet modal
  const exportModal = useModal();

  // password input
  const passwordInput = useInput();

  // export the wallet
  async function exportWallet() {
    if (wallet.type === "hardware") {
      throw new Error("Hardware wallet cannot be exported");
    }

    try {
      // decrypt keyfile
      const decrypted = await decryptWallet(
        wallet.keyfile,
        passwordInput.state
      );

      // download the file
      downloadKeyfile(address, decrypted);

      // remove wallet from memory
      freeDecryptedWallet(decrypted);

      // close modal
      exportModal.setOpen(false);
    } catch (e) {
      console.log("Error exporting wallet", e.message);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("export_wallet_error"),
        duration: 2200
      });
    }
  }

  if (!wallet) {
    return <LoadingView />;
  }

  return (
    <Wrapper>
      <div>
        <Spacer y={0.45} />
        <WalletName>
          {nameServiceName || wallet.nickname}
          {wallet.type === "hardware" && (
            <Tooltip
              content={
                wallet.api.slice(0, 1).toUpperCase() + wallet.api.slice(1)
              }
              position="bottom"
            >
              <HardwareWalletIcon
                src={wallet.api === "keystone" ? keystoneLogo : undefined}
              />
            </Tooltip>
          )}
        </WalletName>
        <WalletAddress>
          {wallet.address}
          <Tooltip
            content={browser.i18n.getMessage("copy_address")}
            position="bottom"
          >
            <CopyButton
              onClick={() => {
                copy(wallet.address);
                setToast({
                  type: "info",
                  content: browser.i18n.getMessage("copied_address", [
                    wallet.nickname,
                    formatAddress(wallet.address, 3)
                  ]),
                  duration: 2200
                });
              }}
            />
          </Tooltip>
        </WalletAddress>
        <Title>{browser.i18n.getMessage("edit_wallet_name")}</Title>
        <InputWithBtn>
          <InputWrapper>
            <Input
              {...walletNameInput.bindings}
              type="text"
              placeholder={browser.i18n.getMessage("edit_wallet_name")}
              fullWidth
              disabled={!!nameServiceName}
            />
          </InputWrapper>
          <IconButton onClick={updateNickname} disabled={!!nameServiceName}>
            Save
          </IconButton>
        </InputWithBtn>
        {!!nameServiceName && (
          <Warning>
            {browser.i18n.getMessage("cannot_edit_with_name_service")}
          </Warning>
        )}
      </div>
      <div>
        <Button
          fullWidth
          onClick={() => exportModal.setOpen(true)}
          disabled={wallet.type === "hardware"}
        >
          <DownloadIcon style={{ marginRight: "5px" }} />
          {browser.i18n.getMessage("export_keyfile")}
        </Button>
        <Spacer y={1} />
        <Button
          fullWidth
          variant="secondary"
          onClick={() => removeModal.setOpen(true)}
        >
          <TrashIcon style={{ marginRight: "5px" }} />
          {browser.i18n.getMessage("remove_wallet")}
        </Button>
      </div>
      <Modal
        {...removeModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => removeModal.setOpen(false)}
            >
              {browser.i18n.getMessage("cancel")}
            </Button>
            <Button
              fullWidth
              onClick={async () => {
                try {
                  await removeWallet(address);
                  setToast({
                    type: "success",
                    content: browser.i18n.getMessage(
                      "removed_wallet_notification"
                    ),
                    duration: 2000
                  });
                } catch (e) {
                  console.log("Error removing wallet", e);
                  setToast({
                    type: "error",
                    content: browser.i18n.getMessage(
                      "remove_wallet_error_notification"
                    ),
                    duration: 2000
                  });
                }
              }}
            >
              {browser.i18n.getMessage("confirm")}
            </Button>
          </>
        }
      >
        <CenterText size="3xl" noMargin>
          {browser.i18n.getMessage("remove_wallet_modal_title")}
        </CenterText>
        <Spacer y={0.55} />
        <CenterText noMargin>
          {browser.i18n.getMessage("remove_wallet_modal_content")}
        </CenterText>
        <Spacer y={0.75} />
      </Modal>
      <Modal
        {...exportModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <Button fullWidth onClick={exportWallet}>
            {browser.i18n.getMessage("export")}
          </Button>
        }
      >
        <CenterText size="xl">
          {browser.i18n.getMessage("export_wallet_modal_title")}
        </CenterText>
        <Input
          type="password"
          placeholder={browser.i18n.getMessage("password")}
          {...passwordInput.bindings}
          fullWidth
        />
        <Spacer y={1} />
      </Modal>
    </Wrapper>
  );
}

const CenterText = styled(Text)`
  text-align: center;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const WalletName = styled(Text).attrs({
  size: "3xl",
  weight: "bold",
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 600;
`;

const HardwareWalletIcon = styled.img.attrs({
  draggable: false
})`
  width: 32px;
  height: 32px;
  object-fit: contain;
  user-select: none;
`;

const WalletAddress = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.37rem;
`;

export const CopyButton = styled(CopyIcon)`
  font-size: 1.5rem;
  width: 1rem;
  height: 1rem;
  color: ${(props) => props.theme.secondaryText};
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    transform: scale(0.87);
  }
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.6em;
`;

const Warning = styled(Text)`
  color: rgb(255, 0, 0, 0.6);
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;
