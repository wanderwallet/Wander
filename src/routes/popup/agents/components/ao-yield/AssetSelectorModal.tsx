import { ListItem } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import WarIcon from "url:/assets/ecosystem/war.svg";
import wUSDCIcon from "url:/assets/ecosystem/wusdc.svg";
import SliderMenu from "~components/SliderMenu";
import { TokenLogo } from "~routes/popup/purchase";

export interface Asset {
  ticker: string;
  logo: string;
}

export const assets: Asset[] = [
  {
    ticker: "wUSDC",
    logo: wUSDCIcon,
  },
  {
    ticker: "wAR",
    logo: WarIcon,
  },
];

interface AssetSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
}

export function AssetSelectorModal({ open, onClose, onSelect }: AssetSelectorModalProps) {
  return (
    <SliderMenu
      title={browser.i18n.getMessage("select_buy_asset")}
      paddingVertical={180}
      isOpen={open}
      onClose={onClose}>
      <AssetSelectorScreen
        onClose={onClose}
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
  updateAsset,
}: {
  onClose: () => void;
  assets: Asset[];
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
        />
      ))}
    </Flex>
  );
};
