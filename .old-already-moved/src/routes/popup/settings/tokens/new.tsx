import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { AddTokenDashboardView } from "~components/dashboard/subsettings/AddToken";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";

export function NewTokenSettingsView() {
  const { navigate } = useLocation();

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("import_token")} back={() => navigate("/quick-settings/tokens")} />
      <Wrapper>
        <AddTokenDashboardView isQuickSetting params={{}} />
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
