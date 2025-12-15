import { useToasts, type DisplayTheme, Text } from "@wanderapp/components";
import { Link } from "~components/common/Link";
import browser from "webextension-polyfill";
import { useTheme } from "styled-components";

const ToastContent = ({ displayTheme }: { displayTheme: DisplayTheme }) => (
  <>
    <Text style={{ color: "#fff" }} weight="medium" noMargin>
      {browser.i18n.getMessage("not_enough_ao_tokens")}
    </Text>
    <Link
      color={displayTheme === "dark" ? "#9787FF" : "#6B57F9"}
      href="https://www.wander.app/help/ao-network---minimum-amount-of-ao-needed-for-transactions">
      {browser.i18n.getMessage("learn_more")}
    </Link>
  </>
);

export function useAoRateLimitedToast() {
  const { setToast } = useToasts();
  const { displayTheme } = useTheme();

  function showAoRateLimitedToast(error: Error) {
    try {
      if (!error?.message?.includes("Rate limit exceeded")) return;

      setToast({
        type: "error",
        content: () => <ToastContent displayTheme={displayTheme} />,
        position: "top",
        duration: 5000,
        showIcon: true,
        showProgress: true,
        progressColor: "linear-gradient(47deg, #5842F8 5.41%, #6B57F9 96%)",
      });
    } catch {}
  }

  return { showAoRateLimitedToast };
}
