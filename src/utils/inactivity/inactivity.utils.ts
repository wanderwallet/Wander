import { inactivityManager } from "./inactivity.manager";

export function initInactivityTracking(): void {
  inactivityManager.initialize();
}

export function recordActivity(): void {
  inactivityManager.recordActivity();
}
