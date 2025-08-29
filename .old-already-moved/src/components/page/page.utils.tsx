import { Page } from "~components/page/page.component";
import type { CommonRouteProps } from "~wallets/router/router.types";

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
