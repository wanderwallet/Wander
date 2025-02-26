import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import screenSrc from "url:/assets-beta/figma-screens/auth.view.png";
import { AuthProviderType } from "embed-api";

export function AuthMoreProvidersEmbeddedView() {
  const { authenticate } = useEmbedded();

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  return (
    <DevFigmaScreen
      title="More options"
      src={screenSrc}
      config={[
        {
          label: "Email & Password",
          onClick: () => authenticate(AuthProviderType.EMAIL_N_PASSWORD)
        },
        {
          label: "Facebook",
          onClick: () => authenticate(AuthProviderType.FACEBOOK)
        },
        {
          label: "Apple",
          onClick: () => authenticate(AuthProviderType.APPLE)
        },
        {
          label: "X",
          onClick: () => authenticate(AuthProviderType.X)
        },
        {
          label: "Back",
          to: "/auth",
          variant: "secondary"
        }
      ]}
    />
  );
}
