import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";

import screenSrc from "url:/assets-beta/figma-screens/add-auth-provider.view.png";

export function AuthAddAuthProviderEmbeddedView() {
  const { authProviderType } = useEmbedded();

  return (
    <DevFigmaScreen
      title={`Add ${authProviderType}`}
      src={screenSrc}
      config={[
        {
          label: `Add ${authProviderType}`,
          onClick: () => alert("Not implemented."),
        },
        {
          label: "Back",
          to: "/auth/add-wallet",
          variant: "secondary",
        },
      ]}
    />
  );
}
