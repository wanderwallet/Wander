import { unlock } from "~wallets/auth";
import browser from "webextension-polyfill";
import {
  Button,
  Input,
  Section,
  Text,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import styled, { useTheme } from "styled-components";
import WanderIcon from "url:assets/icon.svg";
import IconText from "~components/IconText";
import StarIcons from "~components/welcome/StarIcons";

export function UnlockView() {
  // password input
  const passwordInput = useInput();
  const { displayTheme } = useTheme();

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
    }
  }

  return (
    <Wrapper>
      <Content>
        <StarIcons screen="unlock" />
        <IconsContainer>
          <Image
            src={WanderIcon}
            alt="Wander Icon"
            width={90.965}
            height={42.632}
          />
          <IconText width={184.358} height={38.071} />
        </IconsContainer>
        <InputContainer>
          <Text size="lg" weight="medium" noMargin>
            {browser.i18n.getMessage("sign_into_wander")}
          </Text>
          <PasswordInput
            variant="dropdown"
            type="password"
            {...passwordInput.bindings}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              unlockWallet();
            }}
            inputContainerStyle={
              displayTheme === "dark" ? { background: "#403785" } : {}
            }
            autoFocus
          />
        </InputContainer>
      </Content>

      <Section style={{ padding: 24 }}>
        <Button fullWidth onClick={unlockWallet}>
          {browser.i18n.getMessage("sign_in")}
        </Button>
      </Section>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  position: relative;
  width: 100%;
  overflow: hidden;
  background: ${({ theme }) =>
    theme.displayTheme === "dark"
      ? "linear-gradient(180deg, #1e1244 0%, #0d0d0d 100%)"
      : "linear-gradient(180deg, #E3D8F6 0%, #FFF 100%)"};
`;

const Content = styled(Section)`
  position: relative;
  padding: 24;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
`;

const Image = styled.img``;

const IconsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 22.65px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  flex: 1;
`;

const PasswordInput = styled(Input)`
  ::-webkit-input-placeholder {
    color: ${({ theme }) => theme.secondaryText};
  }

  :-ms-input-placeholder {
    color: ${({ theme }) => theme.secondaryText};
  }

  ::placeholder {
    color: ${({ theme }) => theme.secondaryText};
  }
`;
