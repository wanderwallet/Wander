import { render } from "@testing-library/react";

import WanderappUi from "./ui";

describe("WanderappUi", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<WanderappUi />);
    expect(baseElement).toBeTruthy();
  });
});
