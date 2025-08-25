import type { BackgroundModuleFunction } from "~api/background/background-modules";
import Application from "~applications/application";
import { type Gateway } from "~gateways/gateway";

const background: BackgroundModuleFunction<Gateway> = async (appData) => {
  const app = new Application(appData.url);
  const gateway = await app.getGatewayConfig();

  return gateway;
};

export default background;
