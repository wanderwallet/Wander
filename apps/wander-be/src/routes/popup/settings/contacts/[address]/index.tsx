import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { ContactSettingsDashboardView } from "~components/dashboard/subsettings/ContactSettings";
import styled from "styled-components";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";

export interface ContactSettingsViewParams {
  address: string;
}

export type ContactSettingsViewProps = CommonRouteProps<ContactSettingsViewParams>;

export function ContactSettingsView({ params }: ContactSettingsViewProps) {
  const { navigate } = useLocation();

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("setting_contact")} back={() => navigate("/quick-settings/contacts")} />
      <Wrapper>
        <ContactSettingsDashboardView isQuickSetting params={params} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 70px);
`;
