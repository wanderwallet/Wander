import { AnimatePresence } from "framer-motion";
import React, { useEffect, useMemo, type PropsWithChildren } from "react";
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
}

// TODO: Consider adding a prop to `RouteConfig.parseParams` to parse
// params globally inside `PageWithComponent` (e.g. to replace the `Number()`)
// conversions in the Welcome views.

export function Routes({
  routes,
  diffLocation = false,
  pageComponent
}: RoutesProps) {
  const { location } = useLocation();

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
              <PageComponent>
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
    );
  }, [routes, diffLocation ? location : undefined]);

  return (
    <>
      <BodyScroller />

      <AnimatePresence initial={false}>{memoizedRoutes}</AnimatePresence>
    </>
  );
}
