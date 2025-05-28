import React, { useEffect } from "react";

// TODO: Handle component mount/unmount.

export function useAsyncEffect<R>(fn: () => Promise<undefined | (() => void)>, deps: React.DependencyList) {
  useEffect(() => {
    let cleanupFn: undefined | (() => void);

    fn().then((res) => {
      cleanupFn = typeof res === "function" ? res : undefined;
    });

    return cleanupFn;
  }, deps);
}
