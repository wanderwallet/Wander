import type { CreateTransactionInterface } from "arweave/web/common";
import { getActiveKeyfile } from "~wallets";
import { InputWithBtn, InputWrapper } from "./InputWrapper";
import { freeDecryptedWallet } from "~wallets/encryption";
import { PlusIcon, TrashIcon } from "@iconicicons/react";
import type { DecodedTag } from "~api/modules/sign/tags";
import { IconButton } from "~components/IconButton";
import { readFileBinary } from "~utils/file";
import { useRef, useState } from "react";
import { unlock } from "~wallets/auth";
import {
  Button,
  Input,
  Spacer,
  useInput,
  Text,
  FileInput,
  useToasts
} from "@arconnect/components-rebrand";
import type Arweave from "arweave";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { useWallets } from "~utils/wallets/wallets.hooks";

export function ArLocalTransaction({ arweave }: Props) {
  // used to check if a password is required
  const { walletStatus } = useWallets();

  // toast
  const { setToast } = useToasts();

  // password
  const passwordInput = useInput();

  // tx data
  const txTargetInput = useInput();
  const txQtyInput = useInput();
  const [tags, setTags] = useState<DecodedTag[]>([]);
  const [sendingTx, setSendingTx] = useState(false);
  const fileInput = useRef<HTMLInputElement>();

  async function sendTransaction() {
    if (sendingTx || !arweave) return;

    // file in the file input
    const file = fileInput.current?.files?.[0];

    // check required fields
    if (!file) {
      if (
        (!txQtyInput.state || txQtyInput.state === "") &&
        txTargetInput.state !== ""
      ) {
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("fillOutQtyField"),
          duration: 2400
        });
      } else if (
        txQtyInput.state !== "" &&
        (!txTargetInput.state || txTargetInput.state === "")
      ) {
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("fillOutTargetField"),
          duration: 2400
        });
      } else if (
        (txQtyInput.state === "" || !txQtyInput.state) &&
        (txTargetInput.state === "" || !txTargetInput.state) &&
        !file
      ) {
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("addFileError"),
          duration: 2400
        });
      }
    }

    setSendingTx(true);

    let txData: ArrayBuffer | undefined = undefined;

    try {
      // read file
      if (!!file) {
        txData = await readFileBinary(file);
      }
    } catch (e) {
      console.log("Error reading file", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("couldNotReadTxData"),
        duration: 2400
      });
      setSendingTx(false);
      return;
    }

    // unlock if there isn't a decryption key
    if (walletStatus === "locked") {
      const unlockResult = await unlock(passwordInput.state);

      if (!unlockResult) {
        passwordInput.setStatus("error");
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400
        });
        setSendingTx(false);
        return;
      }
    }

    try {
      // get keyfile
      const activeWallet = await getActiveKeyfile();

      if (activeWallet.type === "hardware") {
        return setToast({
          duration: 2200,
          type: "error",
          content: browser.i18n.getMessage("wallet_hardware_unsupported")
        });
      }

      const keyfile = activeWallet.keyfile;

      // create tx
      let initParams: Partial<CreateTransactionInterface> = {
        data: txData
      };

      if (
        !!txTargetInput.state &&
        txTargetInput.state !== "" &&
        !!txQtyInput.state &&
        txQtyInput.state !== ""
      ) {
        initParams = {
          ...initParams,
          target: txTargetInput.state,
          quantity: arweave.ar.arToWinston(txQtyInput.state)
        };
      }

      const transaction = await arweave.createTransaction(initParams, keyfile);

      // add tags
      for (const tag of tags) {
        if (tag.name === "" || tag.value === "") continue;

        transaction.addTag(tag.name, tag.value);
      }

      // add content-type tag if there isn't one already
      if (
        file &&
        !tags.find((tag) => tag.name.toLowerCase() === "content-type")
      ) {
        transaction.addTag("Content-Type", file.type);
      }

      // sign tx
      await arweave.transactions.sign(transaction, keyfile);

      // remove wallet from memory
      freeDecryptedWallet(keyfile);

      // post tx
      if (txData) {
        const uploader = await arweave.transactions.getUploader(transaction);

        while (!uploader.isComplete) {
          await uploader.uploadChunk();
        }
      } else {
        await arweave.transactions.post(transaction);
      }

      // notify the user
      setToast({
        type: "success",
        content: browser.i18n.getMessage("transaction_send_success"),
        duration: 2400,
        action: {
          name: browser.i18n.getMessage("copyId"),
          task: () => copy(transaction.id)
        }
      });

      // reset inputs
      txTargetInput.setState("");
      txTargetInput.setStatus("default");
      txQtyInput.setState("");
      txQtyInput.setStatus("default");

      setTags([]);
      fileInput.current.value = null;
    } catch (e) {
      console.log("Error sending tx", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("transaction_send_error"),
        duration: 2400
      });
    }

    setSendingTx(false);
  }

  return (
    <>
      <Text size="xl" weight="semibold" noMargin>
        {browser.i18n.getMessage("createTransaction")}
      </Text>
      <Text>{browser.i18n.getMessage("createTransactionSubtitle")}</Text>
      <Inputs>
        <HalfInputWrapper>
          <Input
            type="text"
            label={browser.i18n.getMessage("target")}
            placeholder={browser.i18n.getMessage("leaveEmptyForNone")}
            fullWidth
            {...txTargetInput.bindings}
          />
        </HalfInputWrapper>
        <HalfInputWrapper>
          <Input
            type="number"
            label={browser.i18n.getMessage("amount")}
            placeholder={browser.i18n.getMessage("leaveEmptyForNone")}
            fullWidth
            {...txQtyInput.bindings}
          />
        </HalfInputWrapper>
      </Inputs>
      <Spacer y={1} />
      <Text>{browser.i18n.getMessage("tags")}</Text>
      {tags.map((tag, i) => (
        <div key={i}>
          <InputWithBtn>
            <InputWrapper>
              <Input
                type="text"
                label={browser.i18n.getMessage("name")}
                placeholder={browser.i18n.getMessage("tagNamePlaceholder")}
                fullWidth
                value={tag.name}
                onChange={(e) =>
                  setTags((val) =>
                    val.map((t, j) => {
                      if (j !== i) return t;

                      return {
                        ...t,
                        // @ts-expect-error
                        name: e.target.value
                      };
                    })
                  )
                }
              />
            </InputWrapper>
            <InputWrapper>
              <Input
                type="text"
                label={browser.i18n.getMessage("value")}
                placeholder={browser.i18n.getMessage("tagValuePlaceholder")}
                fullWidth
                value={tag.value}
                onChange={(e) =>
                  setTags((val) =>
                    val.map((t, j) => {
                      if (j !== i) return t;

                      return {
                        ...t,
                        // @ts-expect-error
                        value: e.target.value
                      };
                    })
                  )
                }
              />
            </InputWrapper>
            <IconButton
              variant="secondary"
              onClick={() => setTags((val) => val.filter((_, j) => j !== i))}
            >
              <TrashIcon /> Trash
            </IconButton>
          </InputWithBtn>
          <Spacer y={1} />
        </div>
      ))}
      <Button
        fullWidth
        variant="secondary"
        onClick={() => setTags((val) => [...val, { name: "", value: "" }])}
      >
        <PlusIcon /> {browser.i18n.getMessage("addTag")}
      </Button>
      <Spacer y={1} />
      <Text>{browser.i18n.getMessage("data")}</Text>
      <FileInput inputRef={fileInput}>
        {browser.i18n.getMessage("dragAndDropFile")}
      </FileInput>
      {walletStatus === "locked" && (
        <>
          <Spacer y={1} />
          <Input
            {...passwordInput.bindings}
            type="password"
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enterPasswordToDecrypt")}
            fullWidth
          />
        </>
      )}
      <Spacer y={1.35} />
      <Button fullWidth loading={sendingTx} onClick={sendTransaction}>
        {browser.i18n.getMessage("sendTransaction")}
      </Button>
    </>
  );
}

const Inputs = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HalfInputWrapper = styled.div`
  width: 48%;
`;

interface Props {
  arweave: Arweave;
}
