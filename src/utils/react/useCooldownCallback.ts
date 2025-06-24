import { useInterval } from "@swyg/corre";
import { useCallback, useRef, useState } from "react";
import { PersistentStorage, useStorage } from "~utils/storage";

export interface UseCooldownCallbackProps {
  key: string;
  cooldownDuration: number;
}

export interface UseCooldownCallbackReturn<F extends Function> {
  fn: F;
  cooldownSeconds: number;
}

export function useCooldownCallback<F extends Function>(
  callback: F,
  { key, cooldownDuration }: UseCooldownCallbackProps,
): UseCooldownCallbackReturn<F> {
  const [lastCalledAt, setLastCalledAt] = useStorage<number>({ key, instance: PersistentStorage }, (v) => v || 0);

  const [cooldownSeconds, setCooldownSeconds] = useState(() => {
    const elapsedSeconds = Math.round((Date.now() - lastCalledAt) / 1000);

    return Math.max(cooldownDuration - elapsedSeconds, 0);
  });

  const cooldownSecondsRef = useRef(cooldownSeconds);

  cooldownSecondsRef.current = cooldownSeconds;

  useInterval(
    () => {
      setCooldownSeconds((prevSeconds) => {
        return Math.max(prevSeconds - 1, 0);
      });
    },
    cooldownSeconds === 0 ? null : 1000,
  );

  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  const fn = useCallback(
    (...args: any) => {
      const cooldownSeconds = cooldownSecondsRef.current;

      if (cooldownSeconds > 0) throw Error(`Wait ${cooldownSeconds} before calling this function again`);

      const cb = callbackRef.current;

      if (!cb) throw Error("Missing callback function");

      setLastCalledAt(Date.now());
      setCooldownSeconds(cooldownDuration);

      return cb(...args);
    },
    [cooldownDuration],
  );

  return {
    fn: fn as unknown as F,
    cooldownSeconds,
  };
}
