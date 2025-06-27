import styled from "styled-components";
import { Text } from "@arconnect/components-rebrand";
import wanderIcon from "url:/assets/icon.svg";
import { SvgImage } from "~routes/popup/agents/components/SvgImage";
import { useActiveTier } from "~utils/tier/hooks";

export function BenefitsTag() {
  const { data: tier } = useActiveTier();

  return (
    <Tag>
      <SvgImage src={wanderIcon} width={20} height={10} color={tier?.iconColor} />
      <Text noMargin>{tier?.name || "Benefits"}</Text>
    </Tag>
  );
}

const Tag = styled.div`
  display: flex;
  padding: 4px 8px;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${(props) => props.theme.surfaceDefault};
  box-shadow: 0px 0px 3.4px 0px ${(props) => props.theme.primary};
`;
