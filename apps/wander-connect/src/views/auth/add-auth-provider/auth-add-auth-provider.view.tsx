import { useEmbedded } from "../../../utils/embedded.hooks";
import { DevFigmaScreen } from "@wanderapp/ui";

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
