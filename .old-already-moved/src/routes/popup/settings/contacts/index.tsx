import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ContactsDashboardView } from "~components/dashboard/Contacts";
import { useLocation } from "~wallets/router/router.utils";

export function ContactsView() {
  const { navigate } = useLocation();

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("setting_contacts")} back={() => navigate("/quick-settings")} />
      <Wrapper>
        <ContactsDashboardView isQuickSetting params={{}} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: 100%;
`;
