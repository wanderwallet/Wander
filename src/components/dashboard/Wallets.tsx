import { Button, useInput } from "@wanderapp/components";
import { Reorder } from "framer-motion";
import { useEffect, useMemo } from "react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { useRoute } from "wouter";
import { concatGatewayURL } from "~gateways/utils";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import { useNameServiceProfiles } from "~lib/nameservice";
import { ExtensionStorage, useStorage } from "~utils/storage";
import type { StoredWallet } from "~wallets";
import { useLocation } from "~wallets/router/router.utils";
import WalletListItem from "./list/WalletListItem";
import SearchInput from "./SearchInput";

export function WalletsDashboardView() {
  const { navigate } = useLocation();
  // TODO: Replace with useParams:
  const [matches, params] = useRoute<{ address?: string }>("/wallets/:address?");

  // wallets
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage,
    },
    [],
  );

  // active subsetting val
  const activeWalletSetting = useMemo(() => (params?.address ? params.address : undefined), [params]);

  useEffect(() => {
    if (!matches) return;

    const firstWallet = wallets?.[0];

    // return if there is a wallet present in params
    if (!firstWallet || (!!activeWalletSetting && !!wallets.find((w) => w.address == activeWalletSetting))) {
      return;
    }

    // return if the new wallet page is open
    if (activeWalletSetting === "new") return;

    navigate(`/wallets/${firstWallet.address}`);
  }, [wallets, activeWalletSetting]);

  // ans data
  const { data: nameServiceProfiles } = useNameServiceProfiles(wallets.map((w) => w.address));

  // ans shortcuts
  const findProfile = (address: string) => nameServiceProfiles?.find((profile) => profile.address === address);

  const gateway = useGateway(FULL_HISTORY);

  function findAvatar(address: string) {
    const avatar = findProfile(address)?.logo;
    if (!avatar) return undefined;

    const gatewayUrl = concatGatewayURL(gateway);
    return gatewayUrl + "/" + avatar;
  }

  function findLabel(address: string) {
    return findProfile(address)?.name;
  }

  // search
  const searchInput = useInput();

  // search filter function
  function filterSearchResults(wallet: StoredWallet) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      wallet.address.toLowerCase().includes(query.toLowerCase()) ||
      wallet.nickname.toLowerCase().includes(query.toLowerCase()) ||
      findLabel(wallet.address)?.includes(query.toLowerCase())
    );
  }

  return (
    <>
      <Wrapper>
        <SearchWrapper>
          <SearchInput placeholder={browser.i18n.getMessage("search_accounts")} {...searchInput.bindings} />
          <AddWalletButton onClick={() => navigate("/wallets/new")}>
            {browser.i18n.getMessage("add_account")}
          </AddWalletButton>
        </SearchWrapper>
        {wallets && (
          <Reorder.Group
            as="div"
            axis="y"
            onReorder={setWallets}
            values={wallets}
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {wallets.filter(filterSearchResults).map((wallet) => (
              <WalletListItem
                wallet={wallet}
                name={findLabel(wallet.address) || wallet.nickname}
                address={wallet.address}
                avatar={findAvatar(wallet.address)}
                active={activeWalletSetting === wallet.address}
                onClick={() => navigate(`/wallets/${wallet.address}`)}
                key={wallet.address}
              />
            ))}
          </Reorder.Group>
        )}
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;

const SearchWrapper = styled.div`
  position: sticky;
  display: grid;
  gap: 8px;
  top: -32px;
  margin-top: -32px;
  padding: 32px 0 24px;
  z-index: 20;
  grid-template-columns: auto auto;
  background-color: ${(props) => props.theme.cardBackground};
`;

const AddWalletButton = styled(Button).attrs({
  secondary: false,
})`
  width: 100%;
  height: 100%;
`;
