import { useMemo, type MouseEventHandler } from "react";
import { concatGatewayURL } from "~gateways/utils";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import { hoverEffect } from "~utils/theme";
import styled from "styled-components";
import placeholderUrl from "url:/assets/placeholder.png";
import Skeleton from "~components/Skeleton";
import { useTokenBalance } from "~tokens/hooks";
import { useWallets } from "~utils/wallets/wallets.hooks";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import type { TokenInfo } from "~tokens/aoTokens/ao";

export default function Collectible({ id, onClick, ...props }: Props) {
  const gateway = useGateway(FULL_HISTORY);

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const tokenInfo = useMemo(() => {
    return {
      id,
      processId: id,
      Ticker: props.name,
      Name: props.name,
      Denomination: props.divisibility,
      Logo: id,
      type: "collectible" as TokenInfo["type"]
    };
  }, [props]);

  const { data: balance, isLoading } = useTokenBalance(
    tokenInfo,
    activeAddress
  );

  return (
    <Wrapper onClick={onClick}>
      <Image
        src={concatGatewayURL(gateway) + `/${id}`}
        fallback={placeholderUrl}
      >
        <NameAndQty>
          <Name>{props.name || ""}</Name>
          {isLoading ? (
            <Skeleton width="24px" height="20px" />
          ) : (
            <Qty>{balance || "0"}</Qty>
          )}
        </NameAndQty>
      </Image>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  cursor: pointer;
  transition: all 0.07s ease-in-out;

  ${hoverEffect}

  &::after {
    width: calc(100% + 15px);
    height: calc(100% + 15px);
    border-radius: 19.5px;
  }

  &:active {
    transform: scale(0.97);
  }
`;

const Image = styled.div<{ src: string; fallback: string }>`
  position: relative;
  background-image: url(${(props) => props.src}),
    url(${(props) => props.fallback});
  background-size: cover;
  background-position: center;
  padding-top: 100%;
  border-radius: 12px;
  overflow: hidden;
`;

const NameAndQty = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.5rem 0.25rem;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(5px);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
`;

const Name = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.85rem;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Qty = styled(Name)`
  flex: 0 0 auto;
  color: #a0a0a0;
`;

interface Props {
  id: string;
  name: string;
  divisibility?: number;
  onClick?: MouseEventHandler<HTMLDivElement>;
}
