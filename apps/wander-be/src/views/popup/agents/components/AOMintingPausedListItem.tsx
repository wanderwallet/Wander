import { AlertCircle, XClose } from "@untitled-ui/icons-react";
import { Flex } from "~components/common/Flex";
import { Button, Text } from "@arconnect/components-rebrand";
import styled, { useTheme } from "styled-components";
import { useAOMintingStatus } from "../../../../../../../libs/core/src/lib/utils/agents/hooks";
import { ExtensionStorage, useStorage } from "~utils/storage";
import browser from "webextension-polyfill";

export function AOMintingPausedListItem() {
  const theme = useTheme();
  const { data: status, isError, isFetched } = useAOMintingStatus();
  const [showCta, setShowCta] = useStorage(
    {
      key: "show_ao_minting_paused_cta",
      instance: ExtensionStorage,
    },
    true,
  );

  if (!isFetched || isError || status === "Active" || !showCta) return null;

  return (
    <StyledListItem
      padding={8}
      gap={8}
      width="100%"
      align="center"
      borderRadius={8}
      style={{ boxSizing: "border-box" }}>
      <AlertCircle height={24} width={24} color={theme.fail} />
      <Flex gap={8} justify="space-between" align="center" width="100%">
        <Text weight="semibold" noMargin>
          {browser.i18n.getMessage("ao_minting_paused")}
        </Text>
        <Button
          onClick={() => setShowCta(false)}
          icon={<XClose height={24} width={24} />}
          width="fit-content"
          style={{ padding: 0, background: "transparent", height: "24px", width: "24px" }}
          variant="secondary"
        />
      </Flex>
    </StyledListItem>
  );
}

const StyledListItem = styled(Flex)`
  background: ${(props) => (props.theme.displayTheme === "dark" ? "#372323" : "#FFE6E6")};
`;
