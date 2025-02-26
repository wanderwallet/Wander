import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import screenSrc from "url:/assets-beta/figma-screens/auth.view.png";

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
          onClick: () => authenticate("EMAIL_N_PASSWORD")
        },
        {
          label: "Facebook",
          onClick: () => authenticate("FACEBOOK")
        },
        {
          label: "Apple",
          onClick: () => authenticate("APPLE")
        },
        {
          label: "X",
          onClick: () => authenticate("X")
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
