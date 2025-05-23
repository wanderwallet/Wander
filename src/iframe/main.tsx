import { createRoot } from "react-dom/client";
import { WanderConnectAppRoot } from "./iframe";
import {
  EMBEDDED_CLIENT_ID,
  EMBEDDED_THEME,
  EMBEDDED_ANCESTOR_ORIGIN,
  EMBEDDED_HIDE_BE,
  EMBEDDED_SERVER_BASE_URL,
} from "~utils/embedded/iframe.utils";

import "../../assets/popup.css";

if (process.env.NODE_ENV === "development") {
  console.log("Wander Connect URL params =", {
    NODE_ENV: process.env.NODE_ENV,
    EMBEDDED_CLIENT_ID,
    EMBEDDED_THEME,
    EMBEDDED_ANCESTOR_ORIGIN,
    EMBEDDED_HIDE_BE,
    EMBEDDED_SERVER_BASE_URL,
  });
}

createRoot(document.getElementById("root")).render(<WanderConnectAppRoot />);
