import { ArrowUpRight } from "@untitled-ui/icons-react";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { AnimatedStarContainer, defaultStars } from "~components/common/AnimatedStarContainer";
import { Link } from "~components/common/Link";

const stars = defaultStars.toSpliced(1, 1);

interface EarnDelegationNoticeProps {
  onClose: () => void;
}

export function EarnDelegationNotice({ onClose }: EarnDelegationNoticeProps) {
  return (
    <AnimatedStarContainer stars={stars} padding="14px 12px 16px 12px" onClose={onClose} showCloseButton>
      <Flex direction="column" gap={8}>
        <Text style={{ fontSize: 15 }} weight="medium" noMargin>
          {browser.i18n.getMessage("earn_notice_title")}
        </Text>
        <Text variant="secondary" size="xs" weight="medium" noMargin>
          {browser.i18n.getMessage("earn_notice_description")}
        </Text>
        <Link
          href="https://www.wander.app/blog/wndr-fair-launch"
          style={{ color: "#9787FF", gap: "4px", fontSize: 14, fontWeight: 600 }}>
          {browser.i18n.getMessage("learn_more")} <ArrowUpRight height={18} width={18} />
        </Link>
      </Flex>
    </AnimatedStarContainer>
  );
}
