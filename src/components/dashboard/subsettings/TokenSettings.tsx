import {
  Button,
  Select,
  Spacer,
  Text,
  Tooltip,
  useToasts
} from "@arconnect/components-rebrand";
import type { TokenType } from "~tokens/token";
import { Token as aoToken } from "ao-tokens";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { removeToken } from "~tokens";
import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "./WalletSettings";
import browser, { theme } from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { formatAddress } from "~utils/format";
import { defaultTokens, type TokenInfo } from "~tokens/aoTokens/ao";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { Flex } from "~components/common/Flex";
import { RemoveButton } from "~routes/popup/settings/wallets/[address]";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { concatGatewayURL } from "~gateways/utils";
import { getUserAvatar } from "~lib/avatar";
import { defaultGateway } from "~gateways/gateway";
import { TokenLogo } from "../list/TokenListItem";

export interface TokenSettingsDashboardViewParams {
  id: string;
}

export type TokenSettingsDashboardViewProps =
  CommonRouteProps<TokenSettingsDashboardViewParams>;

export function TokenSettingsDashboardView({
  params: { id }
}: TokenSettingsDashboardViewProps) {
  // ao tokens
  const [aoTokens, setAoTokens] = useStorage<TokenInfo[] | any[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const { setToast } = useToasts();

  // token logo
  const [image, setImage] = useState(arLogoDark);

  const [loading, setLoading] = useState(false);

  const token = useMemo(() => {
    const aoToken = aoTokens.find((ao) => ao.processId === id);
    if (!aoToken) return;

    return {
      ...aoToken,
      id: aoToken.processId,
      name: aoToken.Name,
      ticker: aoToken.Ticker
    };
  }, [aoTokens, id]);

  // update token type
  function updateType(type: TokenType) {
    setAoTokens((allTokens) => {
      const tokenIndex = allTokens.findIndex((t) => t.processId === id);
      if (tokenIndex !== -1) {
        allTokens[tokenIndex].type = type;
      }
      return [...allTokens];
    });
  }

  const refreshToken = async () => {
    setLoading(true);
    const defaultToken = defaultTokens.find((t) => t.processId === token.id);
    if (!defaultToken) {
      try {
        const tokenInfo = (await aoToken(token.id)).info;
        if (tokenInfo) {
          const updatedTokens = aoTokens.map((t) =>
            t.processId === token.id
              ? {
                  ...t,
                  Name: tokenInfo.Name,
                  Ticker: tokenInfo.Ticker,
                  Logo: tokenInfo.Logo,
                  Denomination: Number(tokenInfo.Denomination),
                  processId: token.id,
                  lastUpdated: new Date().toISOString()
                }
              : t
          );
          setAoTokens(updatedTokens);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching token info:", err);
        setLoading(false);
      }
    } else {
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // if it is a collectible, we don't need to determinate the logo
        if (token.type === "collectible") {
          return setImage(`${concatGatewayURL(defaultGateway)}/${token.id}`);
        }

        if (token.Logo) {
          const logo = await getUserAvatar(token.Logo);
          return setImage(logo);
        } else {
          return setImage(arLogoDark);
        }
      } catch {
        setImage(arLogoDark);
      }
    })();
  }, [token, theme]);

  if (!token) return null;

  return (
    <Wrapper>
      <Inner>
        <Flex gap={8} align="center">
          <TokenLogo src={image} />
          <TokenName>{token.name}</TokenName>
        </Flex>
        <div>
          <Title>Symbol:</Title>
          <Spacer y={0.5} />
          <Text weight="medium" noMargin>
            {token.ticker}
          </Text>
        </div>
        <div>
          <Title>Address:</Title>
          <Spacer y={0.5} />
          <Flex gap={4} align="center">
            <Text weight="medium" noMargin>
              {token.id}
            </Text>
            <Tooltip content={browser.i18n.getMessage("copy_address")}>
              <CopyButton
                onClick={() => {
                  copy(token.id);
                  setToast({
                    type: "info",
                    content: browser.i18n.getMessage("copied_address", [
                      formatAddress(token.id, 8)
                    ]),
                    duration: 2200
                  });
                }}
              />
            </Tooltip>
          </Flex>
        </div>
        <div>
          <Title>Denomination:</Title>
          <Spacer y={0.5} />
          <Text weight="medium" noMargin>
            {token?.Denomination}
          </Text>
        </div>
        <div>
          <Title>{browser.i18n.getMessage("token_type")}</Title>
          <Spacer y={0.5} />
          <Select
            style={{ paddingLeft: "0px" }}
            onChange={(e) => {
              // @ts-expect-error
              updateType(e.target.value as TokenType);
            }}
            fullWidth
          >
            <option value="asset" selected={token.type === "asset"}>
              {browser.i18n.getMessage("token_type_asset")}
            </option>
            <option value="collectible" selected={token.type === "collectible"}>
              {browser.i18n.getMessage("token_type_collectible")}
            </option>
          </Select>
        </div>
      </Inner>
      <ButtonWrapper>
        <Button
          fullWidth
          onClick={async () => {
            await refreshToken();
          }}
          loading={loading}
        >
          {browser.i18n.getMessage("refresh_token")}
        </Button>

        <RemoveButton fullWidth onClick={() => removeToken(id)}>
          {browser.i18n.getMessage("remove_token")}
        </RemoveButton>
      </ButtonWrapper>
    </Wrapper>
  );
}

const Inner = styled.div`
  gap: 24px;
  display: flex;
  flex-direction: column;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const TokenName = styled(Text).attrs({
  size: "3xl",
  weight: "bold",
  noMargin: true
})`
  font-weight: 600;
`;

const Title = styled(Text).attrs({
  noMargin: true,
  variant: "secondary",
  weight: "medium"
})``;
