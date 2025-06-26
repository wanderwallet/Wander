import { useInterval } from "@swyg/corre";
import { useCallback, useRef, useState } from "react";
import { getResolvablePromise } from "~utils/promises/resolvable";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { PersistentStorage } from "~utils/storage";

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
  const initializationPromiseRef = useRef(getResolvablePromise());
  const cooldownSecondsRef = useRef(-1);
  const [cooldownSeconds, setCooldownSeconds] = useState(-1);

  const updateCooldown: typeof setCooldownSeconds = useCallback((updaterValueOrFunction) => {
    if (typeof updaterValueOrFunction === "number") {
      setCooldownSeconds(updaterValueOrFunction);
      cooldownSecondsRef.current = updaterValueOrFunction;
      if (initializationPromiseRef.current) initializationPromiseRef.current.resolve();
      initializationPromiseRef.current = null;
    } else {
      setCooldownSeconds((prevCooldownSeconds) => {
        const nextCooldownSeconds = updaterValueOrFunction(prevCooldownSeconds);
        cooldownSecondsRef.current = nextCooldownSeconds;
        if (initializationPromiseRef.current) initializationPromiseRef.current.resolve();
        initializationPromiseRef.current = null;
        return nextCooldownSeconds;
      });
    }
  }, []);

  useAsyncEffect(async () => {
    try {
      const lastCalledAt = await PersistentStorage.get(key);
      const elapsedSeconds = Math.round((Date.now() - parseInt(lastCalledAt || "0")) / 1000);

      updateCooldown((prevCooldownSeconds) =>
        prevCooldownSeconds === -1 ? Math.max(cooldownDuration - elapsedSeconds, 0) : prevCooldownSeconds,
      );
    } catch (err) {
      console.error(`Error reading ${key} from storage:`, err);

      updateCooldown(cooldownDuration);

      await PersistentStorage.remove(key).catch((err) => {
        console.error(`Error removing ${key} from storage:`, err);
      });
    }
  }, []);

  useInterval(
    () => {
      updateCooldown((prevSeconds) => {
        return Math.max(prevSeconds - 1, 0);
      });
    },
    cooldownSeconds <= 0 ? null : 1000,
  );

  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  const fn = useCallback(
    async (...args: any) => {
      // If we call the function too early, the hook wouldn't have time to initialize, given the async nature of
      // `PersistentStorage.get()`, so `cooldownSeconds === -1`. As we nee to wait for it to load to know if this
      // function call should be allowed or not, we need to use a Promise here:

      const initializationPromise = initializationPromiseRef.current;

      if (initializationPromise) await initializationPromise;

      const cooldownSeconds = cooldownSecondsRef.current;

      if (cooldownSeconds > 0) {
        if (!initializationPromise) throw Error(`Wait ${cooldownSeconds} before calling this function again`);

        return;
      }

      const cb = callbackRef.current;

      if (!cb) throw Error("Missing callback function");

      PersistentStorage.set(key, Date.now()).catch((err) => {
        console.error(`Error setting ${key} into storage:`, err);
      });

      setCooldownSeconds(cooldownDuration);

      return cb(...args);
    },
    [key, cooldownDuration],
  );

  return {
    fn: fn as unknown as F,
    cooldownSeconds: cooldownSeconds === -1 ? cooldownDuration : cooldownSeconds,
  };
}

export async function hasCooldownPassed({ key, cooldownDuration }: UseCooldownCallbackProps) {
  const lastCalledAt = await PersistentStorage.getItem(key);
  const elapsedSeconds = Math.round((Date.now() - parseInt(lastCalledAt || "0")) / 1000);

  return elapsedSeconds >= cooldownDuration;
}
