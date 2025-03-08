import {
  Button,
  Input,
  Select,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { defaultTokens, type TokenInfo } from "~tokens/aoTokens/ao";
import styled from "styled-components";
import { isAddress } from "~utils/assertions";
import { getAoTokens } from "~tokens";
import { ExtensionStorage } from "~utils/storage";
import { SubTitle } from "./ContactSettings";
import type { TokenType } from "~tokens/token";
import { concatGatewayURL } from "~gateways/utils";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { getTokenInfo } from "~tokens/aoTokens/router";
import { AO_NATIVE_TOKEN } from "~utils/ao_import";

export interface AddTokenDashboardViewProps extends CommonRouteProps {
  isQuickSetting?: boolean;
}

export function AddTokenDashboardView({
  isQuickSetting
}: AddTokenDashboardViewProps) {
  const targetInput = useInput();
  const gateway = useGateway(FULL_HISTORY);
  const [tokenType, setTokenType] = useState<TokenType>("asset");
  const [token, setToken] = useState<TokenInfo>();
  const [loading, setLoading] = useState<boolean>(false);
  const { setToast } = useToasts();

  const onImportToken = async () => {
    try {
      const aoTokens = await getAoTokens();

      if (aoTokens.find((token) => token.processId === targetInput.state)) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("token_already_added"),
          duration: 3000
        });
        throw new Error("Token already added");
      }

      const tokenToImport = {
        ...token,
        processId: targetInput.state,
        type: tokenType
      };

      if (tokenToImport.processId === AO_NATIVE_TOKEN) {
        aoTokens.unshift(tokenToImport);
      } else {
        aoTokens.push(tokenToImport);
      }
      await ExtensionStorage.set("ao_tokens", aoTokens);
      setToast({
        type: "success",
        content: browser.i18n.getMessage("token_imported"),
        duration: 3000
      });
    } catch (err) {
      console.log("err", err);
    }
  };

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        setLoading(true);
        //TODO double check
        targetInput.state !== "AR" && isAddress(targetInput.state);

        const foundToken = defaultTokens.find(
          (t) => t.processId === targetInput.state
        );

        const token = foundToken || (await getTokenInfo(targetInput.state));
        setToken(token);
        setLoading(false);
      } catch (err) {
        setToken(null);
        setLoading(false);
        console.log("err", err);
      }
      setLoading(false);
    };
    fetchTokenInfo();
  }, [targetInput.state, tokenType]);

  return (
    <Wrapper>
      <div>
        {!isQuickSetting && (
          <>
            <Spacer y={0.45} />
            <Title>{browser.i18n.getMessage("import_token")}</Title>
          </>
        )}

        <>
          <Spacer y={0.5} />
          <Select
            small={isQuickSetting}
            label="Asset/Collectible"
            onChange={(e) => {
              // @ts-expect-error
              setTokenType(e.target.value);
            }}
            fullWidth
          >
            <option selected={tokenType === "asset"} value="asset">
              {browser.i18n.getMessage("token_type_asset")}
            </option>
            <option selected={tokenType === "collectible"} value="collectible">
              {browser.i18n.getMessage("token_type_collectible")}
            </option>
          </Select>
        </>

        <Spacer y={1.5} />
        <Input
          sizeVariant={isQuickSetting ? "small" : "normal"}
          {...targetInput.bindings}
          type="string"
          fullWidth
          placeholder="HineOJKYihQiIcZEWxFtgTyxD_dhDNqGvoBlWj55yDs"
          label={"ao process id"}
        />

        {token && (
          <TokenWrapper>
            <SubTitle>TICKER:</SubTitle>
            <Title>{token.Ticker}</Title>
            <SubTitle>NAME:</SubTitle>
            <Title>{token.Name}</Title>
            {tokenType === "collectible" && (
              <Image
                src={concatGatewayURL(gateway) + `/${targetInput.state}`}
              />
            )}
          </TokenWrapper>
        )}
      </div>
      <Button fullWidth disabled={!token || loading} onClick={onImportToken}>
        Add Token
      </Button>
    </Wrapper>
  );
}

const Image = styled.div<{ src: string }>`
  position: relative;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
  padding-top: 100%;
  border-radius: 12px;
`;

const Title = styled(Text).attrs({
  size: "3xl",
  weight: "bold",
  noMargin: true
})`
  font-weight: 600;
  padding-bottom: 10px;
`;

const TokenWrapper = styled.div`
  padding: 36px 0;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;
