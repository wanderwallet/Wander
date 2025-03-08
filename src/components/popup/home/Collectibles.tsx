import { ViewAll } from "../Title";
import { Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import Collectible from "../Collectible";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import { useAoTokens } from "~tokens/aoTokens/ao";

export default function Collectibles() {
  const { navigate } = useLocation();

  const { tokens: collectibles } = useAoTokens({ type: "collectible" });

  return (
    <>
      {collectibles.length == 0 && (
        <NoAssetsContainer>
          <NoAssets>{browser.i18n.getMessage("no_collectibles")}</NoAssets>
        </NoAssetsContainer>
      )}
      <CollectiblesList>
        {collectibles.slice(0, 6).map((collectible, i) => (
          <Collectible
            id={collectible.id}
            name={collectible.Name || collectible.Ticker}
            divisibility={collectible.Denomination}
            onClick={() => navigate(`/collectible/${collectible.id}`)}
            key={i}
          />
        ))}
      </CollectiblesList>
      <Spacer y={1} />
      {collectibles.length > 0 && (
        <ViewAll
          onClick={() => {
            if (collectibles.length === 0) return;
            navigate("/collectibles");
          }}
        >
          {browser.i18n.getMessage("view_all")} ({collectibles.length})
        </ViewAll>
      )}
    </>
  );
}

const CollectiblesList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
`;

const NoAssets = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;

const NoAssetsContainer = styled.div`
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
