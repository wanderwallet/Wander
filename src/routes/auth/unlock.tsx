import { setPasswordFreshness, unlock } from "~wallets/auth";
import {
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";

export function UnlockAuthRequestView() {
  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // unlock Wander
  async function unlockWallet() {
    // unlock using password
    const res = await unlock(passwordInput.state);

    if (!res) {
      passwordInput.setStatus("error");

      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    } else {
      await setPasswordFreshness();
    }
  }

  return (
    <Wrapper>
      <div>
        <HeadAuth title={browser.i18n.getMessage("unlock")} />

        <Spacer y={0.75} />

        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("unlock_wallet_to_use")}
          </Text>
          <Spacer y={1.5} />
          <Input
            type="password"
            {...passwordInput.bindings}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              unlockWallet();
            }}
          />
        </Section>
      </div>

      <Section>
        <AuthButtons
          primaryButtonProps={{
            label: browser.i18n.getMessage("unlock"),
            onClick: unlockWallet
          }}
        />
      </Section>
    </Wrapper>
  );
}
