import { WanderConnect } from "./wander-connect-sdk";

describe("wanderConnectSdk", () => {
  it("should work", () => {
    expect(new WanderConnect({ clientId: "FREE_TRIAL" })).toBeTruthy();
  });
});
