import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Checkbox, RecoverHeaderIcon, Snackbar } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { formatAddress } from "~utils/format";
import { withRetry } from "~utils/promises/retry";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRecoverAccountConfirmEmbeddedView() {
  const { navigate } = useLocation();
  const {
    recoverAccount,
    recoverWallet,
    recoverableAccount,
    deleteImportedTempWallet,
    setRecoverableAccount,
    recoverableAccountWallets,
    authProviderType,
    wallets,
  } = useEmbedded();
  const [shouldRecoverWallet, setShouldRecoverWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const isAccountRecovered = useRef(false);
  const isWalletRecovered = useRef(false);
  const walletsRef = useRef(wallets);

  const lostWallets = useMemo(
    () => recoverableAccountWallets?.filter((wallet) => wallet.canBeRecovered === false) || [],
    [recoverableAccountWallets],
  );

  const recoverableWallets = useMemo(
    () => recoverableAccountWallets?.filter((wallet) => wallet.canBeRecovered === true) || [],
    [recoverableAccountWallets],
  );

  const handleRecoverWallet = useCallback(async () => {
    try {
      if (!isWalletRecovered.current) {
        setIsLoading(true);
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (walletsRef.current.length > 0) {
              clearInterval(interval);
              resolve(true);
            }
          }, 1000);
        });
        await withRetry(recoverWallet, 3, 1000);
        await deleteImportedTempWallet();
        isWalletRecovered.current = true;
      }
    } catch {
    } finally {
      setRecoverableAccount(null);
      navigate(EmbeddedPaths.WalletHomeEmbeddedView);
      setIsLoading(false);
    }
  }, [recoverWallet, deleteImportedTempWallet, navigate]);

  const handleRecoverAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setShouldRecoverWallet(false);
      if (walletsRef.current.length > 0) {
        isAccountRecovered.current = true;
        setShouldRecoverWallet(true);
        return;
      }

      if (!isAccountRecovered.current) {
        await recoverAccount(authProviderType, recoverableAccount.userId);
        isAccountRecovered.current = true;
        setShouldRecoverWallet(true);
      }
    } catch (error) {
      toast.error(error?.message || "Error recovering account");
    } finally {
      setIsLoading(false);
    }
  }, [recoverAccount, recoverableAccount, authProviderType]);

  useEffect(() => {
    if (shouldRecoverWallet && !isWalletRecovered.current) {
      handleRecoverWallet();
      setShouldRecoverWallet(false);
    }
  }, [shouldRecoverWallet, handleRecoverWallet]);

  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  return (
    <OnboardingCard
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover account"
      onBackButtonClick={() => navigate(EmbeddedPaths.AuthRecoverAccount)}
      isLoading={isLoading}>
      <Snackbar
        variant="warning"
        title="Before You Proceed"
        children="Account recovery requires you to recover each wallet separately. Please review your wallets below to understand what will happen to each one."
      />

      {lostWallets.length > 0 ? (
        <Snackbar variant="error" title="Wallets That Cannot Be Recovered">
          <p>
            These wallets have never been backed up. After recovery, you will permanently lose access to these wallets.
          </p>
          <ul>
            {lostWallets.map((wallet, index) => (
              <li key={wallet.address}>• {formatAddress(wallet.address, 16)}</li>
            ))}
          </ul>
        </Snackbar>
      ) : null}

      {recoverableWallets.length > 0 ? (
        <Snackbar variant="success" title="Wallets That Can Be Recovered">
          <p>
            These wallets can be recovered. You will need to follow the recovery process for each wallet. Make sure you
            have your recovery information (recovery file, seed phrase or private key) ready.
          </p>
          <ul>
            {recoverableWallets.map((wallet) => (
              <li key={wallet.address}>• {formatAddress(wallet.address, 16)}</li>
            ))}
          </ul>
        </Snackbar>
      ) : null}

      <Checkbox
        style={{ padding: 0, margin: 0 }}
        label={
          lostWallets.length > 0
            ? "I understand some wallets will be permanently lost."
            : "I have my recovery information ready for each wallet."
        }
        description="Note: you can set this up on the settings page"
        isDisabled={isLoading}
        handleChange={() => setIsChecked(!isChecked)}
        isChecked={isChecked}
      />

      <Button type="submit" isFullWidth isDisabled={isLoading || !isChecked} onClick={handleRecoverAccount}>
        Recover account
      </Button>
    </OnboardingCard>
  );
}
