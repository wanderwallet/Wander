import { useCallback, useEffect, useMemo } from "react";
import { useSearch as useWearch, useLocation as useWouterLocation } from "wouter";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  type RouteConfig,
  type WanderRoutePath,
  type RoutePath,
  type RouteOverride,
  type RouteRedirect,
  type NavigateFn,
  type NavigateOptions,
  type NavigateAction,
  type BaseLocationHook,
} from "~wallets/router/router.types";

export const OVERRIDES_PREFIX = "/__OVERRIDES/" as const;
export const REDIRECT_PREFIX = "/__REDIRECT/" as const;

export function isRouteOverride(path: RoutePath | RouteOverride | RouteRedirect): path is RouteOverride {
  return path.startsWith(OVERRIDES_PREFIX);
}

export function isRouteRedirect<T extends RoutePath>(
  path: RoutePath | RouteOverride | RouteRedirect<T>,
): path is RouteRedirect<T> {
  return path.startsWith(REDIRECT_PREFIX);
}

export function isNavigateAction(to: WanderRoutePath | NavigateAction): to is NavigateAction {
  return typeof to === "number" || !to.startsWith("/");
}

export function parseRouteRedirect<T extends RoutePath>(routeRedirect: RouteRedirect<T>): T {
  return routeRedirect.slice(REDIRECT_PREFIX.length - 1) as T;
}

export function routeTrapInside<T extends RoutePath>(location: RoutePath, baseRoute: T): null | RouteRedirect<T> {
  return location === baseRoute || location.startsWith(`${baseRoute}/`)
    ? null
    : (`${REDIRECT_PREFIX}${baseRoute.slice(1)}` as RouteRedirect<T>);
}

export function routeTrapMatches<T extends RoutePath>(
  location: RoutePath,
  validRoutes: T[],
  redirectTo: T,
): null | RouteRedirect<T> {
  return validRoutes.includes(location as T) ? null : (`${REDIRECT_PREFIX}${redirectTo.slice(1)}` as RouteRedirect<T>);
}

export function routeTrapOutside<T extends RoutePath>(
  location: RoutePath,
  baseRoute: T,
  redirectTo: T,
): null | RouteRedirect<T> {
  return location === baseRoute || location.startsWith(`${baseRoute}/`)
    ? (`${REDIRECT_PREFIX}${redirectTo.slice(1)}` as RouteRedirect<T>)
    : null;
}

export function BodyScroller() {
  const { location } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

// TODO: This doesn't work at all when using <Link /> as its updates won't be pushed to `customHistory`...

// This is just a temporary fix until either:
// - Wouter adds support for `history`.
// - We replace Wouter with a more capable routing library.
// - We implement a proper HistoryProvider that listens for location/history changes and updates its state accordingly.

interface CustomHistoryEntry<S = any> {
  to: WanderRoutePath;
  options?: {
    replace?: boolean;
    state?: S;
  };
}

const customHistory: CustomHistoryEntry[] = [];

const HISTORY_SIZE_LIMIT = 32;

export function useLocation() {
  const [wocation, wavigate] = useWouterLocation();

  const navigate = useCallback(
    <S = any>(to: WanderRoutePath | NavigateAction, options?: NavigateOptions<S>) => {
      let toPath = to as WanderRoutePath;

      if (isNavigateAction(to)) {
        const toParts = wocation.split("/");
        const lastPart = toParts.pop();
        const parentPath = `/${toParts.join("/")}` as WanderRoutePath;

        if (to === "up") {
          toPath = parentPath;
        } else if (typeof to === "string") {
          const page = parseInt(lastPart);

          if (isNaN(page)) throw new Error(`The current location "${location}" doesn't end with an index`);

          if (to === "prev") {
            if (page === 1) throw new Error(`Page 0 out of bounds`);

            toPath = `${parentPath}/${page - 1}` as WanderRoutePath;
          } else if (to === "next") {
            toPath = `/${parentPath}/${page + 1}` as WanderRoutePath;
          }
        } else {
          if (to <= 0) throw new Error(`Page ${to} out of bounds`);

          toPath = `${parentPath}/${to}` as WanderRoutePath;
        }
      }

      if (options?.search) {
        const searchParams = new URLSearchParams();

        Object.entries(options.search).forEach(([key, value]) => {
          searchParams.append(key, encodeURIComponent(value));
        });

        if (searchParams.size > 0) {
          toPath += `?${searchParams.toString()}`;
        }
      }

      customHistory.push({ to: toPath, options });
      customHistory.splice(0, customHistory.length - HISTORY_SIZE_LIMIT);

      return wavigate(toPath, options);
    },
    [wocation, wavigate],
  ) satisfies NavigateFn;

  const back = useCallback(() => {
    // Remove current route...:
    customHistory.pop();

    // ...and read the last one where we want to navigate to:
    const lastRoute = customHistory[customHistory.length - 1];

    // Navigate to the previous route (if available):
    if (lastRoute) wavigate(lastRoute.to, lastRoute.options);
    else wavigate("/");

    // Wouter doesn't handle history, so this won't work:
    // history.back();
  }, [wocation, wavigate]);

  return {
    location: wocation,
    navigate,
    back,
  } as {
    location: WanderRoutePath;
    navigate: typeof navigate;
    back: typeof back;
  };
}

export function useSearchParams<S>() {
  const searchString = useWearch();

  return useMemo(() => {
    if (!searchString) return {};

    const searchParams = new URLSearchParams(searchString);

    return Object.fromEntries(searchParams.entries());
  }, [searchString]) as S;
}

export function withRouterRedirects(locationHook: BaseLocationHook): BaseLocationHook {
  const locationHookWithRedirects: BaseLocationHook = () => {
    const [location, navigate] = locationHook();
    const redirectLocation = isRouteRedirect(location) ? parseRouteRedirect(location) : undefined;

    useEffect(() => {
      if (!redirectLocation) return;

      log(LOG_GROUP.ROUTING, `Redirecting to ${redirectLocation}...`);

      navigate(redirectLocation);
    }, [redirectLocation]);

    return [redirectLocation || location, navigate];
  };

  return locationHookWithRedirects;
}
