import { AnimatePresence } from "framer-motion";
import React, {
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren
} from "react";
import { Switch, Route as Woute } from "wouter";
import { Page } from "~components/page/page.component";
import type {
  CommonRouteProps,
  RouteConfig
} from "~wallets/router/router.types";
import { BodyScroller, useLocation } from "~wallets/router/router.utils";

export interface RoutesProps {
  routes: RouteConfig[];
  diffLocation?: boolean;
  pageComponent?: React.ComponentType<PropsWithChildren>;
  bottomBanner?: React.ReactNode;
}

// TODO: Consider adding a prop to `RouteConfig.parseParams` to parse
// params globally inside `PageWithComponent` (e.g. to replace the `Number()`)
// conversions in the Welcome views.

export function Routes({
  routes,
  diffLocation = false,
  pageComponent,
  bottomBanner
}: RoutesProps) {
  const { location } = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  // In development, check there are no duplicate routes (paths):

  if (process.env.NODE_ENV === "development") {
    useEffect(() => {
      const uniqueRoutes = new Set();

      routes.forEach(({ path }) => {
        if (uniqueRoutes.has(path))
          throw new Error(`Duplicate route "${path}"`);

        uniqueRoutes.add(path);
      });
    }, [routes]);
  }

  const memoizedRoutes = useMemo(() => {
    return (
      <div ref={mainRef}>
        <Switch>
          {routes.map((route) => {
            const Component = route.component;
            const PageComponent =
              pageComponent === null ? React.Fragment : pageComponent || Page;

            // TODO: Async-loaded components?

            const PageWithComponent: React.ComponentType<CommonRouteProps> = (
              props
            ) => {
              return (
                <PageComponent mainRef={mainRef}>
                  <Component {...props} />
                </PageComponent>
              );
            };

            return (
              <Woute
                key={route.key || route.path}
                path={route.path}
                component={PageWithComponent}
              />
            );
          })}
        </Switch>
        {bottomBanner}
      </div>
    );
  }, [routes, diffLocation ? location : undefined, bottomBanner]);

  return (
    <>
      <BodyScroller />

      <AnimatePresence initial={false}>{memoizedRoutes}</AnimatePresence>
    </>
  );
}
