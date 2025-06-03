import { ListItem } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import WarIcon from "url:/assets/ecosystem/war.svg";
import wUSDCIcon from "url:/assets/ecosystem/wusdc.svg";
import SliderMenu from "~components/SliderMenu";
import { TokenLogo } from "~routes/popup/purchase";
import type { Asset } from "~utils/agents/types";
import { WAR_PROCESS_ID, WUSDC_PROCESS_ID } from "~tokens/aoTokens/ao";

export const assets: Asset[] = [
  {
    ticker: "wUSDC",
    logo: wUSDCIcon,
    id: WUSDC_PROCESS_ID,
  },
  {
    ticker: "wAR",
    logo: WarIcon,
    id: WAR_PROCESS_ID,
  },
];

interface AssetSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selectedAsset: Asset;
  onSelect: (asset: Asset) => void;
}

export function AssetSelectorModal({ open, selectedAsset, onClose, onSelect }: AssetSelectorModalProps) {
  return (
    <SliderMenu
      title={browser.i18n.getMessage("select_buy_asset")}
      paddingVertical={180}
      isOpen={open}
      onClose={onClose}>
      <AssetSelectorScreen
        onClose={onClose}
        selectedAsset={selectedAsset}
        updateAsset={(asset) => {
          onSelect(asset);
          onClose();
        }}
        assets={assets}
      />
    </SliderMenu>
  );
}

const AssetSelectorScreen = ({
  onClose,
  assets,
  selectedAsset,
  updateAsset,
}: {
  onClose: () => void;
  assets: Asset[];
  selectedAsset: Asset;
  updateAsset: (asset: Asset) => void;
}) => {
  return (
    <Flex direction="column" gap={8}>
      {assets.map((asset) => (
        <ListItem
          key={`asset-${asset.ticker}`}
          squircleSize={40}
          title={asset.ticker}
          hideSquircle
          icon={<TokenLogo src={asset.logo} style={{ height: 40, width: 40 }} backgroundColor="transparent" />}
          onClick={() => {
            updateAsset(asset);
            onClose();
          }}
          active={selectedAsset.ticker === asset.ticker}
          style={{ border: selectedAsset.ticker === asset.ticker ? "1px solid #6B57F9" : "transparent" }}
        />
      ))}
    </Flex>
  );
};
