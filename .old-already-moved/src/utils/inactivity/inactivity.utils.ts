import { inactivityManager } from "./inactivity.manager";

export function initInactivityTracking(): void {
  inactivityManager.initialize();
}

export async function recordActivity(): Promise<void> {
  await inactivityManager.recordActivity();
}
