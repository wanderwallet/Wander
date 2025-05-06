import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import SliderMenu from "~components/SliderMenu";
import { AlertTriangle } from "@untitled-ui/icons-react";
import { Flex } from "~components/common/Flex";
import { Button, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { ExtensionStorage, useStorage } from "~utils/storage";

export default function RevealRecoveryPhraseModal({ open, close }: Props) {
  const { navigate } = useLocation();
  const [activeAddress] = useStorage(
    {
      key: "active_address",
      instance: ExtensionStorage,
    },
    "",
  );

  return (
    <SliderMenu hasHeader={false} isOpen={open} onClose={close}>
      <Wrapper>
        <Flex direction="column" align="center" textAlign="center" gap={16} width="100%" padding="24px 0px">
          <AlertTriangle height={48} width={48} color="#EEBD41" />
          <Flex direction="column" gap={8}>
            <Text size="xl" weight="semibold" noMargin>
              {browser.i18n.getMessage("reveal_recovery_phrase")}
            </Text>
            <Text
              style={{ textAlign: "center", padding: "0px 24px" }}
              weight="medium"
              variant="secondary"
              lineHeight={1.3}
              noMargin>
              {browser.i18n.getMessage("you_can_only_see_your_recovery_phrase_once")}
            </Text>
          </Flex>
        </Flex>
        <Flex direction="column" gap={8} width="100%">
          <Button fullWidth onClick={() => navigate(`/quick-settings/wallets/${activeAddress}/recovery-phrase`)}>
            I understand
          </Button>
          <Button variant="secondary" fullWidth onClick={close}>
            Go back
          </Button>
        </Flex>
      </Wrapper>
    </SliderMenu>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  width: 100%;
`;

interface Props {
  open: boolean;
  close: () => any;
}
