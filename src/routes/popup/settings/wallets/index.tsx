import { concatGatewayURL } from "~gateways/utils";
import { Button, Section } from "@arconnect/components-rebrand";
import { useEffect, useState } from "react";
import { useStorage } from "~utils/storage";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import WalletListItem from "~components/dashboard/list/WalletListItem";
import HeadV2 from "~components/popup/HeadV2";
import { useLocation } from "~wallets/router/router.utils";
import { ExtensionStorage } from "~utils/storage";
import type { StoredWallet } from "~wallets";
import { getNameServiceProfiles } from "~lib/nameservice";
import type { NameServiceProfile } from "~lib/types";

export function WalletsView() {
  const { navigate } = useLocation();

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

  // ans data
  const [nameServiceProfiles, setNameServiceProfiles] = useState<
    NameServiceProfile[]
  >([]);

  useEffect(() => {
    (async () => {
      if (!wallets) return;

      // fetch profiles
      const profiles = await getNameServiceProfiles(
        wallets.map((w) => w.address)
      );

      setNameServiceProfiles(profiles);
    })();
  }, [wallets]);

  // ans shortcuts
  const findProfile = (address: string) =>
    nameServiceProfiles.find((profile) => profile.address === address);

  const gateway = useGateway(FULL_HISTORY);

  function findAvatar(address: string) {
    const avatar = findProfile(address)?.logo;
    const gatewayUrl = concatGatewayURL(gateway);

    if (!avatar) return undefined;
    return gatewayUrl + "/" + avatar;
  }

  function findLabel(address: string) {
    const label = findProfile(address)?.name;

    if (!label) return undefined;
    return label + ".ar";
  }

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("manage_accounts")}
        showOptions={false}
      />
      <Wrapper showPaddingVertical={false}>
        <WalletsWrapper>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem"
            }}
          >
            {wallets.map((wallet) => (
              <WalletListItem
                wallet={wallet}
                name={findLabel(wallet.address) || wallet.nickname}
                address={wallet.address}
                avatar={findAvatar(wallet.address)}
                active={false}
                activeWallet={activeAddress === wallet.address}
                onClick={() =>
                  navigate(`/quick-settings/wallets/${wallet.address}`)
                }
                key={wallet.address}
              />
            ))}
          </div>
        </WalletsWrapper>

        <ActionBar>
          <Button
            fullWidth
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL("tabs/dashboard.html#/wallets/new")
              })
            }
          >
            {browser.i18n.getMessage("add_an_account")}
          </Button>
        </ActionBar>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100vh - 24px);
`;

const WalletsWrapper = styled.div`
  max-height: 80vh;
  overflow-y: auto;
  padding: 0;

  /* Hide Scrollbar */
  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */
  &::-webkit-scrollbar {
    display: none; /* For Chrome, Safari, and Opera */
  }
`;

const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 0;
  background-color: rgb(${(props) => props.theme.background});
`;
