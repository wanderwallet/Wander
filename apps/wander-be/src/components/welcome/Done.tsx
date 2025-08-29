import { Text } from "@arconnect/components";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";

export default function Done() {
  return (
    <>
      <Text heading>{browser.i18n.getMessage("all_set")}</Text>
      <Paragraph>{browser.i18n.getMessage("all_set_paragraph")}</Paragraph>
    </>
  );
}
