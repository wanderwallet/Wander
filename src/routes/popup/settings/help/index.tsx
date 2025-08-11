import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { HelpListItems } from "~components/help/HelpListItems";

export function HelpView() {
  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("help")} showOptions={false} />
      <Wrapper>
        <HelpListItems />
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
