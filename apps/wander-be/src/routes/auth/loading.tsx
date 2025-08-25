import { LoadingView } from "~components/page/common/loading/loading.view";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import browser from "webextension-polyfill";

export function LoadingAuthRequestView() {
  const { lastCompletedAuthRequest } = useCurrentAuthRequest("any");

  return (
    <LoadingView
      label={browser.i18n.getMessage(
        !lastCompletedAuthRequest || lastCompletedAuthRequest.status === "accepted"
          ? `${lastCompletedAuthRequest?.type || "default"}RequestLoading`
          : `abortingRequestLoading`,
      )}
    />
  );
}
