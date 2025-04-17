import type { AppInfo } from "~applications/application";
import { Row } from "~components/embed/ui";
import Image from "~components/common/Image";
import WanderIcon from "url:assets/icon-embed.svg";

export default function AppIcons({ appInfo }: { appInfo: AppInfo }) {
  return (
    <Row style={{ gap: 0 }}>
      <Image
        height={56}
        width={56}
        borderRadius={56}
        objectFit="contain"
        style={{ marginRight: "-4px" }}
        src={appInfo.logo}
      />
      <Image
        height={56}
        width={56}
        borderRadius={56}
        objectFit="contain"
        style={{ zIndex: 1 }}
        backgroundColor="#F9F9F9"
        src={WanderIcon}
      />
    </Row>
  );
}
