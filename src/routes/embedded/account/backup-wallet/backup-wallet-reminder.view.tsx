import { useRef, useState } from "react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Button, Checkbox, Copyable, Text } from "~components/embed/ui";
import copy from "copy-to-clipboard";
import { useLocation } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import browser from "webextension-polyfill";
import { sleep } from "~utils/promises/sleep";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

export function AccountBackupWalletReminderEmbeddedView() {
  const { navigate } = useLocation();
  const { currentWallet, skipBackUp } = useEmbedded();

  // We use a ref so that this value doesn't change just when users back up their account, forcing the view to re-render
  // differently. Instead, the view should remain unchanged while the redirect to the wallet home is taking place, and
  // only show a different variant once users come back to it later.
  const isMandatoryReminder = useRef(currentWallet.totalExports === 0 && currentWallet.totalBackups === 0 && !currentWallet.doNotAskAgainSetting).current;

  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleSkipClicked = async () => {
    setIsLoading(true);

    await skipBackUp(isChecked);

    // TODO: Temp fix until the button can handle onClick + href automatically:
    await sleep(100);

    navigate(EmbeddedPaths.WalletHomeEmbeddedView);

    setIsLoading(false);
  };

  return (
    <OnboardingCard
      headerText="Wallet backup"
      subtitle={"Secure your wallet by backing it up"}
      hasBackButton={false}
      isLoading={ isLoading }>

      <Text
        variant="bodySm"
        onClick={() =>
          browser.tabs.create({ url: "https://www.wander.app/help/benefits-of-backing-up-your-wander-wallet" })
        }
        style={{
          marginBottom: 24,
          marginTop: -16,
          color: "#0D6CE9",
          cursor: "pointer",
        }}>
        Why should I back up my wallet?
      </Text>

      <Copyable
        style={{ padding: "0" }}
        isFullWidth
        label="Your wallet address"
        value={currentWallet.address}
        onClick={() => {
          copy(currentWallet.address);
        }}
      />

      <Button variant="primary" isDisabled={isLoading} isFullWidth href="/account/backup-wallet">
        Backup now
      </Button>

      {isMandatoryReminder ? (
        <Button variant="secondary" isDisabled={isLoading} isFullWidth href="/wallet" onClick={handleSkipClicked}>
          Backup later
        </Button>
      ) : (
        <Button variant="secondary" isFullWidth href="/wallet">
          Cancel
        </Button>
      )}

      {isMandatoryReminder && (
        <Checkbox
          style={{ padding: 0, margin: 0, marginTop: 24 }}
          label="Don't show this again"
          description="Note: you can set this up on the settings page"
          isDisabled={isLoading}
          handleChange={() => setIsChecked(!isChecked)}
          isChecked={isChecked}
        />
      )}

    </OnboardingCard>
  );
}
