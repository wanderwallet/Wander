import { ButtonV2, Checkbox, Spacer, Text } from "@arconnect/components";
import { PageType, isUserInGDPRCountry, trackPage } from "~utils/analytics";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import JSConfetti from "js-confetti";
import { useEffect } from "react";
import { useLocation } from "~wallets/router/router.utils";

export function LoadDoneWelcomeView() {
  const { navigate } = useLocation();

  // analytics opt-in
  const [analytics, setAnalytics] = useSetting<boolean>("analytics");
  const [answered, setAnswered] = useStorage<boolean>({
    key: "analytics_consent_answered",
    instance: ExtensionStorage
  });

  // finalize
  async function done() {
    if (!analytics && !answered) {
      await setAnswered(true);
      await setAnalytics(false);
    }

    // reset before unload
    window.onbeforeunload = null;

    // redirect to getting started pages
    navigate("/getting-started/1");
  }

  // determine location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const loc = await isUserInGDPRCountry();
        setAnalytics(!loc);
      } catch (err) {
        console.error(err);
      }
    };

    getLocation();
  }, []);

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_COMPLETE);
  }, []);

  // confetti
  useEffect(() => {
    const jsConfetti = new JSConfetti();

    jsConfetti.addConfetti();
  }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("all_set")}</Text>
      <Paragraph>{browser.i18n.getMessage("all_set_paragraph")}</Paragraph>
      <Checkbox
        checked={!!analytics}
        onChange={() => {
          setAnalytics((prev) => !prev);
          setAnswered(true);
        }}
      >
        {browser.i18n.getMessage("analytics_title")}
      </Checkbox>
      <Spacer y={1.5} />
      <ButtonV2 fullWidth onClick={done}>
        {browser.i18n.getMessage("done")}
      </ButtonV2>
    </>
  );
}
