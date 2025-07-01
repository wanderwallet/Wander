import { useEffect, useMemo, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { clsx } from "clsx";

import styles from "./EnvPanel.module.scss";
import { EMBEDDED_SERVER_BASE_URL } from "~utils/embedded/iframe.utils";

export interface EnvPanelProps {}

type EnvStatus = "ok" | "err" | "?";

type EnvType = "local" | "preview" | "development" | "production" | "unknown";

function getEnvColor(envType: EnvType) {
  if (envType === "local") return "grey";
  if (envType === "preview") return "yellow";
  if (envType === "development") return "green";
  if (envType === "production") return "red";
  return "transparent";
}

export function EnvPanel({}: EnvPanelProps) {
  const { location } = useLocation();
  const [isHidden, setIsHidden] = useState(process.env.NODE_ENV !== "development");

  useEffect(() => {
    (window as any).showEnvPanel = () => {
      setIsHidden(false);
    };

    (window as any).hideEnvPanel = () => {
      setIsHidden(true);
    };
  }, []);

  const { envStatus, envStatusColor, clientEnv, clientEnvColor, authEnv, authEnvColor, serverEnv, serverEnvColor } =
    useMemo(() => {
      let envStatus: EnvStatus = "?";
      let clientEnv: EnvType = "unknown";
      let authEnv: EnvType = "unknown";
      let serverEnv: EnvType = "unknown";

      const { hostname } = window.location;

      if (hostname === "localhost") {
        clientEnv = "local";
      } else if (/^https?:\/\/wander-embed-([a-z0-9]+)-community-labs.vercel.app$/.test(hostname)) {
        clientEnv = "preview";
      } else if (hostname === "connect-dev.wander.app") {
        clientEnv = "development";
      } else if (hostname === "connect.wander.app") {
        clientEnv = "production";
      }

      if (import.meta.env?.VITE_SUPABASE_URL === "https://pboorlggoqpyiucxmneq.supabase.co") {
        authEnv = "development";
      } else if (import.meta.env?.VITE_SUPABASE_URL === "https://uqetkgfbdqrdtixnkgdm.supabase.co") {
        authEnv = "production";
      }

      if (EMBEDDED_SERVER_BASE_URL.includes("://localhost:")) {
        serverEnv = "local";
      } else if (/^https?:\/\/embed-([a-z0-9]+)-community-labs.vercel.app$/.test(EMBEDDED_SERVER_BASE_URL)) {
        serverEnv = "preview";
      } else if (EMBEDDED_SERVER_BASE_URL === "https://connect-api-dev.wander.app") {
        serverEnv = "development";
      } else if (EMBEDDED_SERVER_BASE_URL === "https://connect-api.wander.app") {
        serverEnv = "production";
      }

      if (clientEnv === "development") {
        envStatus = authEnv === "development" ? "ok" : "err";
      } else if (clientEnv === "production") {
        envStatus = authEnv === "production" ? "ok" : "err";
      }

      if (envStatus !== "err") {
        if (serverEnv === "development") {
          envStatus = authEnv === "development" ? "ok" : "err";
        } else if (serverEnv === "production") {
          envStatus = authEnv === "production" ? "ok" : "err";
        }
      }

      let envStatusColor = "transparent";

      if (envStatus === "ok") {
        envStatusColor = "green";
      } else if (envStatus === "err") {
        envStatusColor = "red";
      }

      return {
        envStatus,
        envStatusColor,
        clientEnv,
        clientEnvColor: getEnvColor(clientEnv),
        authEnv,
        authEnvColor: getEnvColor(authEnv),
        serverEnv,
        serverEnvColor: getEnvColor(serverEnv),
      };
    }, []);

  if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1" || isHidden) return null;

  return (
    <div className={styles.root}>
      <span className={styles.envStatus} style={{ background: envStatusColor }} title={location}>
        {envStatus.toUpperCase()}
      </span>
      <span className={styles.envType} style={{ background: clientEnvColor }} title={`Client: ${clientEnv}`}>
        C
      </span>
      <span className={styles.envType} style={{ background: authEnvColor }} title={`Auth: ${authEnv}`}>
        A
      </span>
      <span className={styles.envType} style={{ background: serverEnvColor }} title={`Server: ${serverEnv}`}>
        S
      </span>
    </div>
  );
}
