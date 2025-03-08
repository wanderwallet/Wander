import {
  Button,
  Input,
  Text,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import { InputWithBtn, InputWrapper } from "./InputWrapper";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { formatAddress } from "~utils/format";
import browser from "webextension-polyfill";
import type Arweave from "arweave";

export default function Mint({ arweave }: Props) {
  // token qty to add
  const testnetQty = useInput("1");

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // toasts
  const { setToast } = useToasts();

  // mint new AR
  async function mint() {
    try {
      // mint tokens
      const { status, statusText } = await arweave.api.get(
        `/mint/${activeAddress}/${arweave.ar.arToWinston(testnetQty.state)}`
      );

      if (status !== 200) {
        throw new Error(statusText);
      }

      setToast({
        type: "success",
        content: browser.i18n.getMessage("arMinted", [
          testnetQty.state,
          formatAddress(activeAddress, 8)
        ]),
        duration: 3000
      });
    } catch (e) {
      console.log("Failed to mint tokens", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("tokenMintFailed"),
        duration: 2400
      });
    }
  }

  return (
    <>
      <Text size="xl" weight="semibold" noMargin>
        {browser.i18n.getMessage("mintAr")}
      </Text>
      <Text>{browser.i18n.getMessage("addTestnetTokensSubtitle")}</Text>
      <InputWithBtn>
        <InputWrapper>
          <Input
            {...testnetQty.bindings}
            type="number"
            placeholder={browser.i18n.getMessage("arQtyPlaceholder")}
            fullWidth
          />
        </InputWrapper>
        <Button variant="secondary" onClick={mint} style={{ height: "52px" }}>
          {browser.i18n.getMessage("mint")}
        </Button>
      </InputWithBtn>
    </>
  );
}

interface Props {
  arweave: Arweave;
}
