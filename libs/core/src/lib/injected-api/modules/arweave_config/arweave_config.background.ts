import { Application } from "../../../applications/application.class";
import { Gateway } from "../../../gateways/gateway";
import type { BackgroundModuleFunction } from "../../background/background-modules";

const background: BackgroundModuleFunction<Gateway> = async (appData) => {
  const app = new Application(appData.url);
  const gateway = await app.getGatewayConfig();

  return gateway;
};

export default background;
