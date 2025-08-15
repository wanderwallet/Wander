import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";

export function AuthAddAuthProviderEmbeddedView() {
  const { authProviderType } = useEmbedded();

  return (
    <DevFigmaScreen
      title={`Add ${authProviderType}`}
      src=""
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
