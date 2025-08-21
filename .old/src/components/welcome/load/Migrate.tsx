import { ChevronDownIcon, ChevronUpIcon } from "@iconicicons/react";
import type { JWKInterface } from "arweave/node/lib/wallet";
import { Spacer, Text } from "@arconnect/components";
import { useWalletsDetails } from "~wallets/hooks";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useState } from "react";
import Wallet from "./Wallet";

export default function Migrate({ wallets, noMigration, onMigrateClick }: Props) {
  const walletDetails = useWalletsDetails(wallets);
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <Spacer y={1.2} />
      <Title>{browser.i18n.getMessage(noMigration ? "migrate_wallets_not_migrated" : "migrate_wallets_list")}</Title>
      <Spacer y={0.6} />
      <Wallets>
        {walletDetails.slice(0, showAll ? walletDetails.length : 5).map((wallet, i) => (
          <Wallet address={wallet.address} label={wallet.label} key={i} />
        ))}
      </Wallets>
      {noMigration && (
        <>
          <Spacer y={0.475} />
          <MigrateFlex>
            <LinkBtn noMargin onClick={onMigrateClick}>
              {browser.i18n.getMessage("migrate_anyway")}
            </LinkBtn>
            {walletDetails.length > 5 && (
              <LinkBtn noMargin onClick={() => setShowAll((val) => !val)}>
                {browser.i18n.getMessage("view_all")}
                {(showAll && <ChevronUpIcon />) || <ChevronDownIcon />}
              </LinkBtn>
            )}
          </MigrateFlex>
        </>
      )}
      {walletDetails.length > 5 && !noMigration && (
        <>
          <Spacer y={0.475} />
          <LinkBtn noMargin onClick={() => setShowAll((val) => !val)}>
            {browser.i18n.getMessage("view_all")}
            {(showAll && <ChevronUpIcon />) || <ChevronDownIcon />}
          </LinkBtn>
        </>
      )}
    </>
  );
}

const Title = styled(Text).attrs({
  noMargin: true,
})`
  color: rgb(${(props) => props.theme.theme});
`;

const MigrateFlex = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LinkBtn = styled(Title)`
  display: flex;
  align-items: center;
  cursor: pointer;
  width: max-content;
  gap: 0.1rem;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  svg {
    font-size: 1.2em;
    width: 1em;
    height: 1em;
  }
`;

const Wallets = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
`;

export interface WalletInterface {
  address: string;
  label?: string;
}

interface Props {
  wallets: JWKInterface[];
  noMigration: boolean;
  onMigrateClick: () => void;
}
