import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { AddContactDashboardView } from "~components/dashboard/subsettings/AddContact";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";

export function NewContactView() {
  const { navigate } = useLocation();

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("new_contact")} back={() => navigate("/quick-settings/contacts")} />
      <Wrapper>
        <AddContactDashboardView isQuickSetting params={{}} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 80px);
`;
