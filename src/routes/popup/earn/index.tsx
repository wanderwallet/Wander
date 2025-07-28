import styled from "styled-components";
import { Section } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { useState } from "react";
import { EarnPopup } from "~components/popup/earn/EarnPopup";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";

export function EarnView() {
  const [showEarnPopup, setShowEarnPopup] = useState(false);

  useAsyncEffect(async () => {
    const popupShown = (await ExtensionStorage.get<boolean>("earn_popup_shown")) ?? false;
    setShowEarnPopup(!popupShown);
  }, []);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("earn")} />

      <Wrapper></Wrapper>
      <EarnPopup isOpen={showEarnPopup} setOpen={setShowEarnPopup} />
    </>
  );
}

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  padding-bottom: 100px;
`;
