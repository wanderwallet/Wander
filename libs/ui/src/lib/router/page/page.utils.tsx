import { CommonRouteProps } from "@wanderapp/core";
import { Page } from "./page.component";

export function withPage<P extends CommonRouteProps = CommonRouteProps>(Component: React.ComponentType<P>) {
  const PageComponent = (props: P) => {
    return (
      <Page>
        <Component {...props} />
      </Page>
    );
  };

  PageComponent.displayName = `${Component.displayName || "Anonymous"}Page`;

  return PageComponent;
}
