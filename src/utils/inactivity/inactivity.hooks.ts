import { useEffect } from "react";
import { ExtensionStorage } from "../storage";
import { INACTIVITY } from "./inactivity.constants";
import { inactivityManager } from "./inactivity.manager";

export function useActivityTracking() {
  useEffect(() => {
    const setup = async () => {
      const events = ["click", "submit", "change"];

      const isEnabled = await ExtensionStorage.get<boolean>(
        INACTIVITY.STORAGE.AUTO_SIGN_OUT_ENABLED
      );
      if (!isEnabled) return;

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
