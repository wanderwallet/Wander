import { DevFigmaScreen } from "@wanderapp/ui";

export function AuthAddDeviceEmbeddedView() {
  return (
    <DevFigmaScreen
      title="Add Device"
      src=""
      config={[
        {
          label: "Add Device",
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
