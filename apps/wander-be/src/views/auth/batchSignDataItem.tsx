import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { Input, ListItem, Section, Spacer, Text, useInput, useToasts } from "@arconnect/components-rebrand";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useState } from "react";
import styled from "styled-components";
import { SignDataItemDetails } from "~components/SignDataItemsDetails";
import { Quantity } from "ao-tokens";
import { checkPassword } from "~wallets/auth";
import { timeoutPromise } from "~utils/promises/timeout";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";
import { useAskPassword } from "~wallets/hooks";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "~utils/storage";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import type { RawDataItem } from "~api/modules/sign_data_item/types";
import { fetchTokenByProcessId, type TokenInfo } from "~tokens/aoTokens/ao";

export function BatchSignDataItemAuthRequestView() {
  const { authRequest, acceptRequest, rejectRequest } = useCurrentAuthRequest("batchSignDataItem");
  const { data, url } = authRequest;
  const { setToast } = useToasts();
  const [loading, setLoading] = useState<boolean>(false);
  const [transaction, setTransaction] = useState<RawDataItem | null>(null);
  const [transactionList, setTransactionList] = useState<any | null>(null);
  const passwordInput = useInput();
  const askPassword = useAskPassword();

  const [transferRequirePassword] = useStorage<boolean>(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage,
    },
    false,
  );

  async function sign() {
    if (transferRequirePassword && askPassword) {
      const checkPw = await checkPassword(passwordInput.state);

      if (!checkPw) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400,
        });

        return;
      }
    }

    acceptRequest();
  }

  useAsyncEffect(async () => {
    setLoading(true);

    try {
      if (Array.isArray(data)) {
        const listItems = await Promise.all(
          data.map(async (item, index) => {
            let amount = "";
            let name = "";
            const quantity = item?.tags?.find((tag) => tag.name === "Quantity")?.value || "0";
            const transfer = item?.tags?.some((tag) => tag.name === "Action" && tag.value === "Transfer");

            if (transfer && quantity) {
              let tokenInfo: TokenInfo;
              try {
                // TODO: See if dataItem with no `target` property but a Target tag is valid, and update this code if needed.
                tokenInfo = await timeoutPromise(fetchTokenByProcessId(item.target), 6000);
                if (!tokenInfo) {
                  throw new Error("Token not found");
                }
                const tokenAmount = new Quantity(BigInt(quantity), BigInt(tokenInfo.Denomination));
                amount = tokenAmount.toLocaleString();
                name = tokenInfo.Name;
              } catch (error) {
                console.error("Token fetch timed out or failed", error);
                amount = quantity;
                name = item.target;
              }
            }

            // TODO: Add the token logo or a "data" icon next to each item:

            return (
              <ListItem
                key={index}
                title={`Transaction ${index + 1}`}
                subtitle={formatTransactionDescription(amount, name)}
                small
                onClick={() => setTransaction(item)}
              />
            );
          }),
        );
        setTransactionList(listItems);
      }
    } finally {
      setLoading(false);
    }
  }, [data]);

  return (
    <Wrapper>
      <div>
        <HeadAuth
          title={browser.i18n.getMessage("batch_sign_items")}
          back={transaction ? () => setTransaction(null) : undefined}
        />

        <Description>
          <Text noMargin>{browser.i18n.getMessage("batch_sign_data_description", url)}</Text>
        </Description>

        {transaction ? (
          <SignDataItemDetails dataItem={transaction} />
        ) : (
          <div style={{ paddingLeft: "16px", paddingRight: "16px" }}>{transactionList}</div>
        )}
      </div>

      <Section>
        {!transaction ? (
          <>
            {transferRequirePassword && askPassword && (
              <>
                <PasswordWrapper>
                  <Input
                    placeholder="Enter your password"
                    sizeVariant="small"
                    {...passwordInput.bindings}
                    label={"Password"}
                    type="password"
                    onKeyDown={async (e) => {
                      if (e.key !== "Enter") return;
                      await sign();
                    }}
                    fullWidth
                  />
                </PasswordWrapper>
                <Spacer y={1} />
              </>
            )}

            <AuthButtons
              authRequest={authRequest}
              primaryButtonProps={{
                label: browser.i18n.getMessage("sign_authorize_all"),
                disabled: (transferRequirePassword && askPassword && !passwordInput.state) || loading,
                onClick: sign,
              }}
              secondaryButtonProps={{
                onClick: () => rejectRequest(),
              }}
            />
          </>
        ) : (
          <AuthButtons
            authRequest={authRequest}
            primaryButtonProps={{
              onClick: () => setTransaction(null),
            }}
          />
        )}
      </Section>
    </Wrapper>
  );
}

function formatTransactionDescription(amount?: string, tokenName?: string): string {
  if (amount && tokenName) {
    return `Sending ${amount} of ${tokenName}`;
  }
  return "Unknown transaction";
}

const Description = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const PasswordWrapper = styled.div`
  display: flex;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;
