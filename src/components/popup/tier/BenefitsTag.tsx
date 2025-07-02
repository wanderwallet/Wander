import styled from "styled-components";
import { Loading, Text } from "@arconnect/components-rebrand";
import { useActiveTier } from "~utils/tier/hooks";
import browser from "webextension-polyfill";
import { useLocation } from "~wallets/router/router.utils";
import { WanderIcon } from "./WanderIcon";
import { useMemo } from "react";
import { TierTypes } from "~utils/tier/constants";

export function BenefitsTag() {
  const { data: activeTier, isLoading } = useActiveTier();
  const { navigate } = useLocation();

  const tier = useMemo(() => {
    if (isLoading || !activeTier || activeTier?.tier === TierTypes.Core) return browser.i18n.getMessage("benefits");
    return activeTier?.tier;
  }, [activeTier, isLoading]);

  return (
    <Tag onClick={() => navigate("/tier")}>
      <WanderIcon tier={"Prime"} />
      {isLoading ? <Loading style={{ width: "20px", height: "20px" }} /> : <Text noMargin>{tier}</Text>}
    </Tag>
  );
}

const Tag = styled.div`
  display: flex;
  padding: 4px 8px;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${(props) => props.theme.surfaceDefault};
  box-shadow: 0px 0px 3.4px 0px ${(props) => props.theme.primary};

  &:hover {
    background: ${(props) => props.theme.surfaceSecondary};
  }
`;
