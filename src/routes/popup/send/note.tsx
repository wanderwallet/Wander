import { PageType, trackPage } from "~utils/analytics";
import { useEffect } from "react";
import { Section } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { useStorage } from "@plasmohq/storage/hook";
import { TempTransactionStorage } from "~utils/storage";
import styled from "styled-components";

export function NoteView() {
  const [note, setNote] = useStorage<string>(
    {
      key: "last_send_note",
      instance: TempTransactionStorage
    },
    ""
  );

  // Segment
  useEffect(() => {
    trackPage(PageType.SEND_NOTE);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("add_a_note")}
        showOptions={false}
      />

      <Section
        style={{ height: "calc(100vh - 100px)" }}
        showPaddingVertical={false}
      >
        <NoteInput
          placeholder={browser.i18n.getMessage("add_a_note")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Section>
    </>
  );
}

const NoteInput = styled.textarea`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.primaryText};
  height: 100%;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  margin: 0;
  resize: none;

  ::-webkit-input-placeholder {
    color: ${({ theme }) => theme.input.placeholder.default};
  }

  :-ms-input-placeholder {
    color: ${({ theme }) => theme.input.placeholder.default};
  }

  ::placeholder {
    color: ${({ theme }) => theme.input.placeholder.default};
  }
`;
