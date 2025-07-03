import styled from "styled-components";
import { Loading, Text } from "@arconnect/components-rebrand";
import { useActiveTier } from "~utils/tier/hooks";
import browser from "webextension-polyfill";
import { useLocation } from "~wallets/router/router.utils";
import { WanderIcon } from "./WanderIcon";
import { useMemo } from "react";
import { TierTypes } from "~utils/tier/constants";

const boxShadows = {
  [TierTypes.Elite]:
    "inset 0px 1px 1px rgba(234, 208, 131, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(216, 187, 81, 0.3), inset 0px 1px 8px rgba(125, 102, 35, 0.2)",
  [TierTypes.Prime]:
    "inset 0px 1px 1px rgba(212, 212, 212, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(6, 45, 60, 0.3), inset 0px 1px 8px rgba(90, 93, 94, 0.2)",
  [TierTypes.Plus]:
    "inset 0px 1px 1px rgba(134, 229, 169, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(8, 59, 88, 0.3), inset 0px 1px 8px rgba(90, 93, 94, 0.2)",
  [TierTypes.Select]:
    "inset 0px 1px 1px rgba(131, 215, 245, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(8, 59, 88, 0.3), inset 0px 1px 8px rgba(13, 136, 207, 0.2)",
  [TierTypes.Core]:
    "inset 0px 1px 1px rgba(151, 135, 255, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(107, 87, 249, 0.3), inset 0px 1px 8px rgba(107, 87, 249, 0.2)",
};

export function TierTag() {
  const { data: activeTier, isLoading } = useActiveTier();
  const { navigate } = useLocation();
  const boxShadow = boxShadows[activeTier?.tier] || boxShadows[TierTypes.Core];

  const tier = useMemo(() => {
    if (isLoading || !activeTier) return browser.i18n.getMessage("benefits");
    return activeTier?.tier;
  }, [activeTier, isLoading]);

  return (
    <Tag boxShadow={boxShadow} onClick={() => navigate("/tier")}>
      <WanderIcon height={9.37} width={20} tier={activeTier?.tier} />
      {isLoading ? (
        <Loading style={{ width: "20px", height: "20px" }} />
      ) : (
        <Text weight="medium" noMargin>
          {tier}
        </Text>
      )}
    </Tag>
  );
}

const Tag = styled.div<{ boxShadow: string }>`
  display: flex;
  padding: 4px 8px;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: ${(props) => props.theme.surfaceDefault};
  box-shadow: ${(props) => props.boxShadow};
  backdrop-filter: blur(7.550000190734863px);

  &:hover {
    background: ${(props) => props.theme.surfaceSecondary};
  }
`;
