import { Text, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { AnimatedStarContainer, defaultStars } from "~components/common/AnimatedStarContainer";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";

const stars = defaultStars.toSpliced(1, 1);

interface EarnAOTokensDetectedNoticeProps {
  onClose: () => void;
}

export function EarnAOTokensDetectedNotice({ onClose }: EarnAOTokensDetectedNoticeProps) {
  const { navigate } = useLocation();
  return (
    <AnimatedStarContainer stars={stars} padding="14px 12px 16px 12px" onClose={onClose} showCloseButton>
      <Flex direction="column" gap={8}>
        <Text weight="medium" noMargin>
          {browser.i18n.getMessage("ao_tokens_detected")}
        </Text>
        <Text variant="secondary" size="xs" weight="medium" noMargin>
          {browser.i18n.getMessage("diversify_portfolio")}
        </Text>
        <Button
          style={{ borderRadius: 12, height: "36px", fontSize: 12, fontWeight: 600 }}
          onClick={() => navigate(PopupPaths.ManageEarnings)}
          fullWidth>
          {browser.i18n.getMessage("start_delegating")}
        </Button>
      </Flex>
    </AnimatedStarContainer>
  );
}
