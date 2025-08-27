import { Input, Section, Text, useInput, useToasts } from "@arconnect/components-rebrand";
import Message from "~components/auth/Message";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { useAskPassword } from "~wallets/hooks";
import styled from "styled-components";
import { checkPassword } from "~wallets/auth";

export function DecryptAuthRequestView() {
  const { authRequest, acceptRequest, rejectRequest } = useCurrentAuthRequest("decrypt");

  const { authID, url, message } = authRequest;

  const { setToast } = useToasts();

  const askPassword = useAskPassword();
  const passwordInput = useInput();
  const [transferRequirePassword] = useStorage<boolean>(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage,
    },
    false,
  );

  async function decrypt() {
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
    await acceptRequest();
  }

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await acceptRequest();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [authID]);

  return (
    <Wrapper>
      <div>
        <HeadAuth title={browser.i18n.getMessage("titles_decrypt")} />

        <Section>
          <Text noMargin>{browser.i18n.getMessage("decrypt_description", url)}</Text>

          <div style={{ marginTop: "16px" }}>
            <Message message={message} />
          </div>
        </Section>
      </div>
      <Section style={{ paddingTop: 0, paddingBottom: 0 }}>
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
                  await decrypt();
                }}
                fullWidth
              />
            </PasswordWrapper>
          </>
        )}
      </Section>
      <Section style={{ paddingTop: 12 }}>
        <AuthButtons
          authRequest={authRequest}
          primaryButtonProps={{
            label: browser.i18n.getMessage("decrypt_authorize"),
            onClick: decrypt,
          }}
          secondaryButtonProps={{
            onClick: () => rejectRequest(),
          }}
        />
      </Section>
    </Wrapper>
  );
}

const PasswordWrapper = styled.div`
  display: flex;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;
