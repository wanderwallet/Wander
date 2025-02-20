import { WalletIcon } from "@iconicicons/react";
import {
  Button,
  ListItem,
  Spacer,
  Text,
  useToasts
} from "@arconnect/components-rebrand";
import { concatGatewayURL } from "~gateways/utils";
import { type Variants } from "framer-motion";
import { formatFiatBalance } from "~tokens/currency";
import type { HardwareApi } from "~wallets/hardware";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { formatAddress, truncateMiddle } from "~utils/format";
import type { StoredWallet } from "~wallets";
import { useEffect, useMemo, useState } from "react";
import HardwareWalletIcon from "~components/hardware/HardwareWalletIcon";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import { findGateway } from "~gateways/wayfinder";
import browser from "webextension-polyfill";
import Squircle from "~components/Squircle";
import styled, { useTheme } from "styled-components";
import { svgie } from "~utils/svgies";
import { useLocation } from "~wallets/router/router.utils";
import { getNameServiceProfiles } from "~lib/nameservice";
import SliderMenu from "~components/SliderMenu";
import { CopyToClipboard } from "~components/CopyToClipboard";
import { PlusCircle, QrCode02, XClose } from "@untitled-ui/icons-react";
import BigNumber from "bignumber.js";
import { fetchWalletBalances } from "~utils/balances";
import useSetting from "~settings/hook";
import QRModal from "~components/modals/QRModal";

export default function WalletSwitcher({ open, close }: Props) {
  const theme = useTheme();
  const { navigate } = useLocation();

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalAddress, setQrModalAddress] = useState("");

  // current address
  const [activeAddress, setActiveAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all wallets added
  const [storedWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  const [currency] = useSetting<string>("currency");

  // load wallet datas
  const [wallets, setWallets] = useState<DisplayedWallet[]>([]);

  const [walletBalances, setWalletBalances] = useState<
    Record<string, { ar: BigNumber; fiat: BigNumber }>
  >({});

  const activeWallet = useMemo(
    () => wallets?.find(({ address }) => address === activeAddress),
    [activeAddress, wallets]
  );

  const inactiveWallets = useMemo(() => {
    return wallets.filter((wallet) => wallet.address !== activeAddress);
  }, [wallets, activeAddress]);

  // load default wallets array
  useEffect(() => {
    setWallets(
      (storedWallets || []).map((wallet) => ({
        name: wallet.nickname,
        address: wallet.address,
        balance: "0",
        hasAns: false,
        api: wallet.type === "hardware" ? wallet.api : undefined
      }))
    );
    setUpdateAvatars(true);
  }, [storedWallets]);

  // load ANS data for wallet
  const [loadedAns, setLoadedAns] = useState(true);

  // update avatars flag
  const [updateAvatars, setUpdateAvatars] = useState(false);

  useEffect(() => {
    (async () => {
      if (wallets.length === 0 || !updateAvatars) return;

      // get ans profiles
      const profiles = await getNameServiceProfiles(
        wallets.map((val) => val.address)
      );
      const gateway = await findGateway({ startBlock: 0 });

      // update wallets state
      setWallets((val) =>
        val.map((wallet) => {
          const profile = profiles.find(
            ({ address }) => address === wallet.address
          );
          const svgieAvatar = svgie(wallet.address, { asDataURI: true });

          return {
            ...wallet,
            name: profile?.name || wallet.name,
            avatar: profile?.logo
              ? concatGatewayURL(gateway) + "/" + profile.logo
              : svgieAvatar,
            hasAns: !!profile
          };
        })
      );

      setLoadedAns(true);
      setUpdateAvatars(false);
    })();
  }, [wallets.length, updateAvatars]);

  useEffect(() => {
    const updateBalances = async () => {
      if (open && inactiveWallets.length > 0) {
        const balances = await fetchWalletBalances(inactiveWallets, currency);
        setWalletBalances(balances);
      }
    };

    updateBalances();
  }, [open, inactiveWallets, currency]);

  // toasts
  const { setToast } = useToasts();

  return (
    <SliderMenu
      hasHeader={false}
      title={browser.i18n.getMessage("wallets")}
      isOpen={open}
      onClose={close}
    >
      <CloseIcon
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
      />
      <Wrapper>
        <CurrentWallet>
          <Avatar img={activeWallet?.avatar}>
            {!activeWallet?.avatar && <NoAvatarIcon />}
            {activeWallet?.api === "keystone" && (
              <HardwareWalletIcon icon={keystoneLogo} color="#2161FF" />
            )}
          </Avatar>
          <Spacer y={0.75} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              justifyContent: "center",
              maxWidth: "100%"
            }}
          >
            <Text
              size="md"
              weight="semibold"
              style={{
                flex: 1,
                textAlign: "center",
                flexWrap: "wrap",
                wordBreak: "break-word"
              }}
              noMargin
            >
              {activeWallet?.name}
            </Text>
            {activeWallet?.address === activeAddress && <ActiveIndicator />}
          </div>
          <Spacer y={0.2} />
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <CopyToClipboard
              labelStyle={{
                fontSize: 14,
                color: theme.secondaryText,
                fontWeight: 500
              }}
              label={formatAddress(activeWallet?.address, 4)}
              text={activeWallet?.address}
            />
            <QrCode02
              height={16}
              width={16}
              color={theme.tertiaryText}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setQrModalAddress(activeWallet?.address);
                setQrModalOpen(true);
              }}
            />
          </div>
          <Spacer y={1} />
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate(`/quick-settings/wallets/${activeAddress}`)}
          >
            {browser.i18n.getMessage("edit_account")}
          </Button>
        </CurrentWallet>
        <WalletsContainer
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Text weight="semibold" noMargin>
            {browser.i18n.getMessage("your_other_accounts")}
          </Text>
          <Wallets>
            {inactiveWallets.map((wallet, i) => (
              <Wallet
                key={i}
                onClick={() => {
                  setActiveAddress(wallet.address);
                  setToast({
                    type: "success",
                    content: browser.i18n.getMessage("switchedToWallet", [
                      wallet.name
                    ]),
                    duration: 1100
                  });
                  close();
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexDirection: "row"
                  }}
                >
                  <Avatar img={wallet.avatar}>
                    {!wallet.avatar && <NoAvatarIcon />}
                    {wallet.api === "keystone" && (
                      <HardwareWalletIcon icon={keystoneLogo} color="#2161FF" />
                    )}
                  </Avatar>

                  <WalletTitle>
                    <WalletName>{truncateMiddle(wallet.name, 20)}</WalletName>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center"
                      }}
                    >
                      <Text
                        variant="secondary"
                        size="sm"
                        weight="medium"
                        noMargin
                      >
                        {formatAddress(wallet.address, 4)}
                      </Text>
                      <CopyToClipboard text={wallet.address} />
                      <QrCode02
                        height={16}
                        width={16}
                        color={theme.tertiaryText}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setQrModalAddress(wallet.address);
                          setQrModalOpen(true);
                        }}
                      />
                    </div>
                  </WalletTitle>
                </div>
                <Balance>
                  {formatFiatBalance(
                    walletBalances[wallet.address]?.fiat || BigNumber(0),
                    currency.toLowerCase()
                  )}
                </Balance>
              </Wallet>
            ))}
          </Wallets>
          <ListItem
            style={{ marginLeft: "-8px", marginRight: "-8px" }}
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL("tabs/dashboard.html#/wallets/new")
              })
            }
            title={browser.i18n.getMessage("add_account")}
            titleStyle={{ fontSize: 18, fontWeight: 500 }}
            hideSquircle
            small
          >
            <PlusCircle height={32} width={32} color={theme.tertiaryText} />
          </ListItem>
        </WalletsContainer>
        <QRModal
          isOpen={qrModalOpen}
          setOpen={setQrModalOpen}
          address={qrModalAddress}
        />
      </Wrapper>
    </SliderMenu>
  );
}

export const popoverAnimation: Variants = {
  closed: {
    scale: 0.4,
    opacity: 0,
    transition: {
      type: "spring",
      duration: 0.4
    }
  },
  open: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.4,
      delayChildren: 0.2,
      staggerChildren: 0.05
    }
  }
};

const CloseIcon = styled(XClose)`
  cursor: pointer;
  position: absolute;
  top: 0px;
  right: 0px;
  color: ${(props) => props.theme.tertiaryText};
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  width: 100%;
`;

const WalletsContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CurrentWallet = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Wallets = styled.div``;

const Wallet = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  cursor: pointer;
  background-color: transparent;
  transition: background-color 0.23s ease-in-out;
  padding: 8px;
  margin-left: -8px;
  margin-right: -8px;

  &:hover {
    background-color: ${(props) => props.theme.surfaceSecondary};
  }
`;

const WalletTitle = styled.div`
  display: flex;
  flex-direction: column;
`;

const WalletName = styled(Text).attrs({ noMargin: true })`
  color: ${(props) => props.theme.primaryText};
`;

const ActiveIndicator = styled.span`
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background-color: ${(props) => props.theme.success};
`;

const Balance = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  variant: "secondary"
})``;

const Avatar = styled(Squircle)`
  position: relative;
  width: 2.375rem;
  height: 2.375rem;
  cursor: pointer;

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }
`;

const NoAvatarIcon = styled(WalletIcon)`
  position: absolute;
  font-size: 1.2rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

interface Props {
  open: boolean;
  close: () => any;
}

interface DisplayedWallet {
  name: string;
  api?: HardwareApi;
  address: string;
  balance: string;
  avatar?: string;
  hasAns: boolean;
}
