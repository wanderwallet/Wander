import { useEffect } from "react";
import { ExtensionStorage } from "../storage";
import { INACTIVITY } from "./inactivity.constants";
import { inactivityManager } from "./inactivity.manager";
import type { AutoLockSettings } from "./inactivity.types";

export function useActivityTracking() {
  useEffect(() => {
    const setup = async () => {
      const events = ["click", "submit", "change"];

      const settings = await ExtensionStorage.get<AutoLockSettings>(
        INACTIVITY.STORAGE.AUTO_LOCK
      );
      if (!settings?.enabled) return;

      inactivityManager.recordActivity();

      const handleActivity = () => inactivityManager.recordActivity();

      events.forEach((event) => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleActivity);
        });
        inactivityManager.recordActivity.cancel();
      };
    };

    let cleanup: (() => void) | undefined;
    setup().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => cleanup?.();
  }, []);
}
