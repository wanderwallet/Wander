import type { PermissionType } from "~applications/permissions";
import { ExtensionStorage } from "./storage";
import { type Gateway } from "~gateways/gateway";
import type { EventType } from "mitt";

interface SecurityEvent {
  type: string;
  app: string;
  date: number;
}

/**
 * Push an event to the stored events array
 *
 * @param event Event to push
 */
export async function pushEvent(event: SecurityEvent) {
  let events = (await ExtensionStorage.get<SecurityEvent[]>("events")) || [];

  // only allow the last 99 events
  events = events.filter((_, i) => i < 98);
  events.push(event);

  await ExtensionStorage.set("events", events);
}

/** Injected wallet events */
export interface InjectedEvents extends Record<EventType, unknown> {
  connect: { permissions: PermissionType[] };
  disconnect: null;
  activeAddress: string;
  addresses: string[];
  permissions: PermissionType[];
  gateway: Gateway;
}
