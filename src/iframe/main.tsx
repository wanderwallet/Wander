import { createRoot } from "react-dom/client";
import { ArConnectEmbeddedAppRoot } from "./iframe";

import "../../assets/popup.css";

createRoot(document.getElementById("root")).render(
  <ArConnectEmbeddedAppRoot />
);
