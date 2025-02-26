import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import screenSrc from "url:/assets-beta/figma-screens/add-wallet-confirmation.view.png";

export function AccountConfirmationEmbeddedView() {
  const { wallets, lastRegisteredWallet, clearLastRegisteredWallet } =
    useEmbedded();

  return (
    <DevFigmaScreen
      title={
        wallets.length === 1
          ? "Congratulations, your account has been created!"
          : `Congratulations, your wallet has been ${
              lastRegisteredWallet.source.type === "IMPORTED"
                ? "imported"
                : "created"
            }!`
      }
      src={screenSrc}
      config={[
        {
          label: lastRegisteredWallet.address,
          isDisabled: true
        },
        {
          label: "Done",
          onClick: () => clearLastRegisteredWallet()
        }
      ]}
    />
  );
}
