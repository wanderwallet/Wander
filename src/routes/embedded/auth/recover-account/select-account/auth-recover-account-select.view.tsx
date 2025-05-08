import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useState } from "react";
import { Card, WanderFooter, Box, Text } from "~components/embed/ui";
import type { RecoverableAccount } from "embed-api";
import { useLocation } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { truncateMiddle } from "~utils/format";
import { toast } from "react-toastify";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AuthRecoverAccountSelectEmbeddedView() {
  const { navigate } = useLocation();
  const [loading, setLoading] = useState(false);
  const { recoverableAccounts, setRecoverableAccount, fetchRecoverableAccountWallets } = useEmbedded();

  const handleSelectAccount = useCallback(
    async (account: RecoverableAccount) => {
      try {
        setRecoverableAccount(account);
        await fetchRecoverableAccountWallets(account);
        navigate(EmbeddedPaths.Auth);
      } catch (error) {
        toast.error("Error fetching recoverable account wallets");
      } finally {
        setLoading(false);
      }
    },
    [setRecoverableAccount, navigate, fetchRecoverableAccountWallets],
  );

  return (
    <Card headerText="Select account to recover" footerElement={<WanderFooter />} hasBackButton={false} size="auto">
      <Box>
        {recoverableAccounts.map((account) => (
          <Box
            hasBorder
            style={{ cursor: "pointer" }}
            key={account.userId}
            onClick={() => handleSelectAccount(account)}>
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
