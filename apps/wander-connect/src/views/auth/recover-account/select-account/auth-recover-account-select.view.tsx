import { useCallback, useState } from "react";
import { Box, Text, Button, RecoverHeaderIcon, Flex, OnboardingCard } from "@wanderapp/ui";
import type { RecoverableAccount } from "embed-api";
import { truncateMiddle, useLocation } from "@wanderapp/core";
import { toast } from "react-toastify";
import { EmbeddedPaths } from "../../../../router/dashboard/iframe.routes";
import { useEmbedded } from "../../../../utils/embedded.hooks";

export function AuthRecoverAccountSelectEmbeddedView() {
  const { navigate } = useLocation();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { recoverableAccounts, setRecoverableAccount, fetchRecoverableAccountWallets } = useEmbedded();

  const handleSelectAccount = useCallback(
    async (account: RecoverableAccount) => {
      try {
        setLoading((prev) => ({ ...prev, [account.userId]: true }));
        setRecoverableAccount(account);
        await fetchRecoverableAccountWallets(account);
        navigate(EmbeddedPaths.Auth);
      } catch (error) {
        toast.error("Error fetching recoverable account wallets");
      } finally {
        setLoading((prev) => ({ ...prev, [account.userId]: false }));
      }
    },
    [setRecoverableAccount, navigate, fetchRecoverableAccountWallets],
  );

  return (
    <OnboardingCard
      headerIcon={<RecoverHeaderIcon />}
      headerText="Select account to recover"
      onBackButtonClick={() => navigate(EmbeddedPaths.AuthRecoverAccount)}>
      <Box style={{ maxHeight: "400px", overflowY: "auto" }}>
        <Flex direction="column" gap={2} width="100%">
          {recoverableAccounts?.map((account) => (
            <Button
              style={{ height: "max-content", paddingTop: 8, paddingBottom: 8 }}
              variant="outlined"
              key={account.userId}
              isLoading={loading[account.userId]}
              isDisabled={loading[account.userId]}
              onClick={() => handleSelectAccount(account)}>
              <Flex direction="column" gap={1} align="center" justify="center">
                <Text>{truncateMiddle(account.userId, 30)}</Text>
                <Text>{account?.email || account?.name || account?.phone}</Text>
              </Flex>
            </Button>
          ))}
        </Flex>
      </Box>
    </OnboardingCard>
  );
}
