import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback } from "react";
import { Card, WanderFooter, Box, Text } from "~components/embed/ui";
import type { RecoverableAccount } from "embed-api";
import { useLocation } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { truncateMiddle } from "~utils/format";

export function AuthRecoverAccountSelectEmbeddedView() {
  const { navigate } = useLocation();
  const { recoverableAccounts, setAccountToRecover } = useEmbedded();

  const handleSelectAccount = useCallback(
    (account: RecoverableAccount) => {
      setAccountToRecover(account);
      navigate("/auth/recover-account/authentication");
    },
    [setAccountToRecover, navigate]
  );

  return (
    <Card
      headerText="Select account to recover"
      footerElement={<WanderFooter />}
      hasBackButton={false}
      size="auto"
    >
      <Box>
        {recoverableAccounts.map((account) => (
          <Box
            hasBorder
            style={{ cursor: "pointer" }}
            key={account.userId}
            onClick={() => handleSelectAccount(account)}
          >
            <Flex direction="column" gap={1} justify="center" align="center">
              <Text>{truncateMiddle(account.userId, 30)}</Text>
              <Text>{account?.email || account?.name || account?.phone}</Text>
            </Flex>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
