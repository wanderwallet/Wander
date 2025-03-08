import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";

import screenSrc from "url:/assets-beta/figma-screens/add-device.view.png";

export function AuthAddDeviceEmbeddedView() {
  return (
    <DevFigmaScreen
      title="Add Device"
      src={screenSrc}
      config={[
        {
          label: "Add Device",
          onClick: () => alert("Not implemented.")
        },
        {
          label: "Back",
          to: "/auth/add-wallet",
          variant: "secondary"
        }
      ]}
    />
  );
}
