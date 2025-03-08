import { ArrowRightIcon, DashboardIcon, MoonIcon } from "@iconicicons/react";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { SetupWelcomeViewParams } from "~routes/welcome/setup";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { Button } from "@arconnect/components-rebrand";
import Paragraph from "~components/Paragraph";
import Checkbox from "~components/Checkbox";

export type ThemeWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function ThemeWelcomeView({ params }: ThemeWelcomeViewProps) {
  const { navigate } = useLocation();

  // theme
  const [theme, setTheme] = useSetting("display_theme");

  // Segment
  // TODO: specify if this is an imported or new wallet
  useEffect(() => {
    trackPage(PageType.ONBOARD_THEME);
  }, []);

  return (
    <Container>
      <Content>
        <Paragraph>
          {browser.i18n.getMessage("choose_ui_theme_description")}
        </Paragraph>
        <Checkbox
          checked={theme === "system"}
          onChange={() => setTheme("system")}
          label={browser.i18n.getMessage("system_theme")}
        />
        <Checkbox
          checked={theme === "light"}
          onChange={() => setTheme("light")}
          label={browser.i18n.getMessage("light_theme")}
        />
        <Checkbox
          checked={theme === "dark"}
          onChange={() => setTheme("dark")}
          label={browser.i18n.getMessage("dark_theme")}
        />
      </Content>
      <Button
        fullWidth
        onClick={() =>
          navigate(`/${params.setupMode}/${Number(params.page) + 1}`)
        }
      >
        {browser.i18n.getMessage("continue")}
      </Button>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  gap: 24px;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
`;
