import React, { useEffect } from "react";

export function useAsyncEffect<R>(fn: () => Promise<void | (() => void)>, deps: React.DependencyList) {
  useEffect(() => {
    let isMounted = true;
    let cleanupFn: undefined | (() => void);

    fn().then((res) => {
      // set cleanup function if mounted
      if (isMounted) {
        cleanupFn = typeof res === "function" ? res : undefined;
      } else if (typeof res === "function") {
        // call immediately if unmounted before async finished
        res();
      }
    });

    return () => {
      isMounted = false;
      cleanupFn?.();
    };
  }, deps);
}
