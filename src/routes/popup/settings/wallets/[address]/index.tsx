import {
  Button,
  Input,
  ListItem,
  Section,
  Text,
  Tooltip,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import { CopyIcon } from "@iconicicons/react";
import { removeWallet, type StoredWallet } from "~wallets";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import { formatAddress, truncateMiddle } from "~utils/format";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { LoadingView } from "~components/page/common/loading/loading.view";
import { CopyToClipboard } from "~components/CopyToClipboard";
import {
  AlertCircle,
  ArrowUpRight,
  Cube01,
  Download01,
  Edit02,
  QrCode02,
  Share03
} from "@untitled-ui/icons-react";
import { HorizontalLine } from "~components/HorizontalLine";
import SliderMenu from "~components/SliderMenu";
import { getNameServiceProfile } from "~lib/nameservice";

export interface WalletViewParams {
  address: string;
}

export type WalletViewProps = CommonRouteProps<WalletViewParams>;

export function WalletView({ params: { address } }: WalletViewProps) {
  const { navigate } = useLocation();

  const [editName, setEditName] = useState(false);
  const [open, setOpen] = useState(false);

  const theme = useTheme();

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

      const arnsProfile = await getNameServiceProfile(wallet.address);
      setNameServiceName(arnsProfile?.name);
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

  if (!wallet) {
    return <LoadingView />;
  }

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("edit_account")}
        showOptions={false}
      />
      <Wrapper>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}
        >
          {!editName ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem"
              }}
            >
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
              {nameServiceName ? (
                <Tooltip
                  position="bottomEnd"
                  content={browser.i18n.getMessage(
                    "cannot_edit_with_name_service"
                  )}
                >
                  <Edit02
                    style={{ cursor: "not-allowed" }}
                    height={20}
                    width={20}
                  />
                </Tooltip>
              ) : (
                <Edit02
                  style={{ cursor: "pointer" }}
                  height={20}
                  width={20}
                  onClick={() => setEditName(true)}
                />
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.8rem" }}>
              <Input
                sizeVariant="small"
                {...walletNameInput.bindings}
                type="text"
                placeholder={browser.i18n.getMessage("edit_wallet_name")}
                fullWidth
                disabled={!!nameServiceName}
              />
              <Button
                style={{ width: "100px" }}
                onClick={() => {
                  if (walletNameInput.state !== wallet.nickname) {
                    updateNickname();
                  }
                  setEditName(false);
                }}
                disabled={!!nameServiceName}
              >
                {browser.i18n.getMessage(
                  walletNameInput.state === wallet.nickname ? "cancel" : "save"
                )}
              </Button>
            </div>
          )}
          <CopyToClipboard
            copySuccess={browser.i18n.getMessage("copied_address", [
              wallet.nickname,
              formatAddress(wallet.address, 3)
            ])}
            label={truncateMiddle(wallet.address, 38)}
            labelAs={WalletAddress}
            text={wallet.address}
            iconSize={24}
          />
          <HorizontalLine />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <Text size="lg" weight="medium" noMargin>
              {browser.i18n.getMessage("wallet_actions")}
            </Text>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}
            >
              <ListItem
                title={"Viewblock"}
                titleStyle={{ fontSize: 18, fontWeight: 500 }}
                icon={<Icon color="primary" as={Cube01} />}
                rightIcon={<Icon color="tertiary" as={Share03} />}
                onClick={() =>
                  browser.tabs.create({
                    url: `https://viewblock.io/arweave/address/${wallet.address}`
                  })
                }
                hideSquircle
              />
              <ListItem
                title={"AO Link"}
                titleStyle={{ fontSize: 18, fontWeight: 500 }}
                icon={<Icon color="primary" as={ArrowUpRight} />}
                rightIcon={<Icon color="tertiary" as={Share03} />}
                hideSquircle
                onClick={() =>
                  browser.tabs.create({
                    url: `https://www.ao.link/#/entity/${wallet.address}`
                  })
                }
              />
              <ListItem
                title={browser.i18n.getMessage("generate_qr_code")}
                titleStyle={{ fontSize: 18, fontWeight: 500 }}
                icon={<Icon color="primary" as={QrCode02} />}
                hideSquircle
                showArrow
                onClick={() =>
                  navigate(`/quick-settings/wallets/${address}/qr`)
                }
              />
              <ListItem
                title={browser.i18n.getMessage("export_keyfile")}
                titleStyle={{ fontSize: 18, fontWeight: 500 }}
                icon={<Icon color="primary" as={Download01} />}
                hideSquircle
                showArrow
                onClick={() =>
                  navigate(`/quick-settings/wallets/${address}/export`)
                }
              />
            </div>
          </div>
        </div>
        <div>
          <RemoveButton fullWidth onClick={() => setOpen(true)}>
            {browser.i18n.getMessage("remove_account")}
          </RemoveButton>
        </div>
        <SliderMenu
          hasHeader={false}
          isOpen={open}
          onClose={() => setOpen(false)}
        >
          <Section
            showPaddingHorizontal={false}
            showPaddingVertical={false}
            style={{
              alignItems: "center",
              gap: 24,
              height: "60vh",
              justifyContent: "space-between",
              textAlign: "center"
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertCircle height={48} width={48} color={theme.fail} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <Text size="xl" weight="semibold" lineHeight={1.3} noMargin>
                  {browser.i18n.getMessage("remove_account")}?
                </Text>
                <Text
                  variant="secondary"
                  weight="medium"
                  lineHeight={1.3}
                  noMargin
                >
                  {browser.i18n.getMessage("remove_account_description")}
                </Text>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                {browser.i18n.getMessage("cancel")}
              </Button>
              <RemoveButton
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
                    navigate("/quick-settings/wallets");
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
                {browser.i18n.getMessage("remove")}
              </RemoveButton>
            </div>
          </Section>
        </SliderMenu>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section).attrs({
  showPaddingVertical: false
})`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100vh - 100px);
`;

const WalletName = styled(Text).attrs({
  noMargin: true,
  size: "xl",
  weight: "semibold"
})`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const HardwareWalletIcon = styled.img.attrs({
  draggable: false
})`
  width: 32px;
  height: 32px;
  object-fit: contain;
  user-select: none;
`;

const WalletAddress = styled(Text).attrs({
  size: "sm",
  weight: "medium",
  variant: "secondary"
})``;

export const CopyButton = styled(CopyIcon)`
  font-size: 1em;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    transform: scale(0.87);
  }
`;

export const RemoveButton = styled(Button).attrs({
  variant: "secondary"
})`
  background: ${({ theme }) =>
    theme.displayTheme === "dark" ? "#372323" : "#ffeeed"};
  color: ${({ theme }) =>
    theme.displayTheme === "dark" ? "#F1655B" : "#D22B1F"};

  &:hover {
    background: ${({ theme }) =>
      theme.displayTheme === "dark" ? "#372323" : "#ffeeed"};
    opacity: 0.8;
  }
`;

const Icon = styled(Cube01)<{ color?: "primary" | "secondary" | "tertiary" }>`
  height: 24px;
  width: 24px;
  color: ${({ theme, color }) =>
    color ? theme[`${color}Text`] : theme.primaryText};
`;
