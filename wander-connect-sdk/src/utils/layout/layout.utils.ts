import { LayoutConfig, LayoutType } from "../../wander-connect.types";

const LAYOUT_TYPES = ["modal", "popup", "sidebar", "half"] as const satisfies LayoutType[];

export function isRouteConfig(obj: unknown): obj is LayoutConfig {
  return !!(obj && typeof obj === "object" && "type" in obj && LAYOUT_TYPES.includes(obj.type as LayoutType));
}
