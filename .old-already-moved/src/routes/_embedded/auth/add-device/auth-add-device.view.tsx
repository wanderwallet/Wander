import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";

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
