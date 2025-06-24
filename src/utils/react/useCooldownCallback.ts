import { useInterval } from "@swyg/corre";
import { useCallback, useRef, useState } from "react";
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
  const [cooldownSeconds, setCooldownSeconds] = useState(cooldownDuration);

  useAsyncEffect(async () => {
    try {
      const lastCalledAt = await PersistentStorage.get(key);
      const elapsedSeconds = Math.round((Date.now() - parseInt(lastCalledAt)) / 1000);

      setCooldownSeconds(Math.max(cooldownDuration - elapsedSeconds, 0));
    } catch (err) {
      console.error(`Error reading ${key} from storage:`, err);

      await PersistentStorage.remove(key).catch((err) => {
        console.error(`Error removing ${key} from storage:`, err);
      });
    }
  }, []);

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
    cooldownSeconds,
  };
}
