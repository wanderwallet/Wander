import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { CloseIcon, FolderIcon, WalletIcon } from "@iconicicons/react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import styled, { keyframes, useTheme } from "styled-components";
import { Loading, Text } from "@arconnect/components-rebrand";
import { formatAddress } from "~utils/format";
import { readFileString } from "~utils/file";
import { wordlists } from "bip39-web-crypto";
import browser from "webextension-polyfill";
import { UploadCloud02 } from "@untitled-ui/icons-react";

export default function SeedInput({
  verifyMode,
  onChange,
  onReady,
  onMnemonicLengthChange,
  defaultLength = 12,
  verifyWords,
  inputType = "seedphrase",
  loading = false
}: Props) {
  const theme = useTheme();

  // length of the seedphrase
  const [activeLength, setActiveLength] = useState<SeedLength>(defaultLength);

  // words
  const [words, setWords] = useState<string[]>(Array(24).fill(""));
  const [mismatchedWords, setMismatchedWords] = useState<{
    [key: number]: boolean;
  }>({});
  const [wordsToConfirm, setWordsToConfirm] = useState<
    { [key: number]: string } | undefined
  >();

  const handleInputBlur = useCallback(
    (index: number) => {
      if (!verifyMode) return;
      setMismatchedWords((val) => {
        const newMismatchedWords = { ...val };
        newMismatchedWords[index] =
          words[index] && words[index] !== verifyWords?.[index];
        return newMismatchedWords;
      });
    },
    [words]
  );

  const handleMnemonicLengthChange = () => {
    const newLength = activeLength === 12 ? 24 : 12;
    setActiveLength(newLength);
    onMnemonicLengthChange?.(newLength);
  };

  // pre-filled words
  useEffect(() => {
    if (!verifyWords) return;
    const preFilledObj: { [key: number]: string } = {};
    verifyWords.forEach((word, index) => {
      if (word !== "") preFilledObj[index] = word;
    });
    setWordsToConfirm(preFilledObj);
  }, [verifyWords]);

  // are all the word inputs empty
  const isEmpty = useMemo(() => words.every((word) => word === ""), [words]);

  // current seedphrase state joined
  // from the words array
  const currentSeedphrase = useMemo(
    () =>
      words
        .slice(0, activeLength)
        .map((val) => val.replace(/\s/g, ""))
        .join(" ")
        .replaceAll(/\s+/g, " ")
        .trim(),
    [words, activeLength]
  );

  // onchange event
  useEffect(() => {
    if (!onChange) return;
    onChange(!isEmpty ? currentSeedphrase : undefined);
  }, [currentSeedphrase, isEmpty]);

  // drop effect show
  const [dropShow, setDropShow] = useState(false);

  // loaded wallet file name
  const [loadedFileName, setLoadedFileName] = useState<string>();

  // parse file from event data transfer
  function parseFileFromEvent(e: DragEvent<unknown>) {
    let file: File;

    // get with itemlist
    if (e.dataTransfer.items) {
      const item = e.dataTransfer.items[0];

      // check item type
      if (item.kind === "file") {
        // get file
        file = item.getAsFile();
      }
    }

    // get with filelist
    if (!file) {
      file = e.dataTransfer.files[0];
    }

    return file;
  }

  // try to trigger the wallet read event
  async function triggerWalletRead(file: File) {
    // check file type
    if (!file?.type?.includes("application/json")) return;

    // read file and convert it to json
    const fileData: JWKInterface = JSON.parse(await readFileString(file));

    // call wallet read event
    if (onChange) onChange(fileData);

    // set file name
    setLoadedFileName(formatAddress(file.name, 8));

    // show layer
    setDropShow(true);
  }

  // to correct the drag layer
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => setDropShow(dragCounter === 1), [dragCounter]);

  return (
    <Wrapper
      dragging={dropShow}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault();
        if (verifyMode) return;
        setDragCounter((val) => val + 1);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragCounter((val) => val - 1);
      }}
      onDrop={(e) => {
        // prevent default open behavior
        e.preventDefault();

        if (verifyMode) return;

        if (dropShow) {
          setDragCounter(0);
        }

        // get file
        const file = parseFileFromEvent(e);

        // trigger event
        triggerWalletRead(file);
      }}
    >
      <AnimatePresence>
        {dropShow && (
          <DragLayer>
            {loadedFileName && (
              <CloseDragLayerButton
                onClick={() => {
                  setLoadedFileName(undefined);
                  setDropShow(false);

                  // trigger onChange event
                  onChange(!isEmpty ? currentSeedphrase : undefined);
                }}
              />
            )}
            <AnimatePresence>
              {(loadedFileName && (
                <motion.div
                  initial="hidden"
                  animate="shown"
                  variants={scaleAppearAnimation}
                  key="walleticon"
                >
                  <WalletIcon color={theme.primaryText} />
                </motion.div>
              )) || (
                <motion.div
                  initial="hidden"
                  animate="shown"
                  variants={scaleAppearAnimation}
                  key="fileicon"
                >
                  <FolderIcon color={theme.primaryText} />
                </motion.div>
              )}
            </AnimatePresence>
            <DragText>
              {loadedFileName ||
                browser.i18n.getMessage("drag_and_drop_wallet")}
            </DragText>
          </DragLayer>
        )}
      </AnimatePresence>
      {inputType === "keyfile" && (
        <KeyfileInput
          onClick={() => {
            if (verifyMode || !isEmpty) return;

            // create fake input
            const input = document.createElement("input");

            input.type = "file";
            input.accept = ".json,application/json";
            input.click();

            // on file selected
            input.addEventListener("change", (e: Event) => {
              // get file
              const file = (e.target as HTMLInputElement).files[0];

              // trigger event
              triggerWalletRead(file);

              // remove input
              input.remove();
            });
          }}
        >
          {loading ? (
            <>
              <Loading style={{ height: 32, width: 32 }} />
              <Text size="sm" weight="medium" variant="secondary">
                Importing account...
              </Text>
            </>
          ) : (
            <>
              <UploadCloud02 height={48} width={48} color={theme.primaryText} />
              <div
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4
                }}
              >
                <ClickToUploadText>
                  {browser.i18n.getMessage("click_to_upload")}
                </ClickToUploadText>
                <Text size="sm" weight="medium" variant="secondary" noMargin>
                  {browser.i18n.getMessage("or_drag_and_drop_your_keyfile")}
                </Text>
              </div>
            </>
          )}
        </KeyfileInput>
      )}

      {inputType === "seedphrase" && (
        <>
          <WordsWrapper verifyMode={verifyMode}>
            {words.slice(0, activeLength).map((word, i) => (
              <WordInputWrapper
                hide={verifyMode && !wordsToConfirm?.[i]}
                isConfirmed={verifyMode && wordsToConfirm?.[i] === words[i]}
                isMismatched={mismatchedWords[i]}
                onBlur={() => handleInputBlur(i)}
                key={i}
              >
                <Text variant="secondary" noMargin>
                  {i + 1}.
                </Text>
                <SuggestionWrapper>
                  <WordInputSuggestion>
                    {(word !== "" &&
                      wordlists.english.filter((val) =>
                        val.startsWith(word)
                      )[0]) ||
                      ""}
                  </WordInputSuggestion>
                  <WordInput
                    onPaste={(e) => {
                      // return if verify mode is enabled
                      // we don't want the user to paste in
                      // their entire seedphrase
                      if (verifyMode) return e.preventDefault();

                      // get pasted words
                      const pastedWords = e.clipboardData
                        .getData("Text")
                        .split(" ");

                      // check length
                      if (pastedWords.length <= 1) return;

                      // update words
                      for (let j = i; j < pastedWords.length + i; j++) {
                        if (j > activeLength) break;

                        words[j] = pastedWords[j - i];
                      }

                      // update state
                      setWords([...words]);

                      // prevent default paste
                      e.preventDefault();
                    }}
                    value={word}
                    onChange={(e) => {
                      words[i] = e.target.value;

                      setWords([...words]);
                    }}
                    onKeyDown={(e) => {
                      // autocomplete
                      if (
                        (e.key === "Tab" || e.key === "Enter") &&
                        word !== ""
                      ) {
                        // get suggested word
                        const suggestedWord = wordlists.english.filter((val) =>
                          val.startsWith(word)
                        )[0];

                        // fill input with the suggested word
                        if (suggestedWord) {
                          words[i] = suggestedWord;

                          setWords([...words]);
                        }
                      }

                      // check key code
                      if (e.key !== " " && e.key !== "Enter") return;

                      // prevent default action
                      e.preventDefault();

                      // don't progress for the last input
                      // in the seedphrase
                      if (i === activeLength - 1) {
                        if (onReady) onReady();
                        return;
                      }

                      // trick to move to the next input
                      const inputs = document.getElementsByTagName("input");

                      let currentInputIndex = 0;

                      // find the current input's index
                      while (inputs[currentInputIndex] !== e.target) {
                        currentInputIndex++;
                      }

                      // progress to the next input
                      inputs[currentInputIndex + 1].focus();
                    }}
                    aria-invalid={
                      !wordlists.english.find((v) => v === word) && word !== ""
                    }
                  />
                </SuggestionWrapper>
                {verifyMode &&
                  mismatchedWords[i] &&
                  wordsToConfirm?.[i] !== words[i] && (
                    <ErrorText>
                      {browser.i18n.getMessage("word_mismatch_error")}
                    </ErrorText>
                  )}
              </WordInputWrapper>
            ))}
          </WordsWrapper>
          {!verifyMode && (
            <LengthSelector onClick={handleMnemonicLengthChange}>
              {browser.i18n.getMessage("recovery_phrase_length_selector", [
                activeLength === 12 ? "24" : "12"
              ])}
            </LengthSelector>
          )}
        </>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div<{ dragging?: boolean }>`
  position: relative;
  padding: 0;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
`;

const LengthSelector = styled(Text).attrs({
  noMargin: true,
  size: "sm",
  weight: "semibold"
})`
  color: #9787ff;
  cursor: pointer;
`;

const WordsWrapper = styled.div<{ verifyMode?: boolean }>`
  ${(props) =>
    props.verifyMode
      ? `display: flex; flex-direction: column; gap: 1rem;`
      : `display: grid; grid-template-columns: 1fr 1fr 1fr;gap: 0.5rem 1rem;`}
  padding-bottom: 1rem;
`;

const WordInputWrapper = styled.div<{
  hide?: boolean;
  isConfirmed?: boolean;
  isMismatched?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.05rem;
  padding: 12px;
  transition: all 0.23s ease-in-out;
  height: 42px;
  border-radius: 10px;
  box-shadow: 0px 2px 3.3px 0px rgba(0, 0, 0, 0.07) inset;
  background: ${(props) => props.theme.input.background.default.default};
  box-sizing: border-box;
  ${(props) =>
    (props.isConfirmed || props.isMismatched) &&
    `border: 1px solid ${props.isConfirmed ? "#56C980" : "#F1655B"};`}
  ${(props) => props.hide && `display: none;`}
`;

const errorShake = keyframes`
  0% {
    transform: translateX(8px);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(2px);
  }
  100% {
    transform: translateX(0);
  }
`;

const WordInput = styled.input.attrs({
  type: "text"
})`
  display: flex;
  flex: 1;
  background-color: transparent;
  border: none;
  padding: 0.15rem 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  outline: none;
  width: 100%;
  color: ${(props) => props.theme.primaryText};
  z-index: 2;
  transition: all 0.23s ease-in-out;

  &:not(:focus)[aria-invalid="true"] {
    color: #ff0000;
    animation: ${errorShake} 0.4s linear;
  }
`;

const WordInputSuggestion = styled.span`
  position: absolute;
  top: 0.15rem;
  left: 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: ${(props) => props.theme.input.placeholder.default};
  z-index: -1;
  user-select: none;
  transition: all 0.23s ease-in-out;
`;

const SuggestionWrapper = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  z-index: 1;

  &:not(:focus-within) {
    ${WordInputSuggestion} {
      opacity: 0;
    }
  }
`;

const dragLayerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

const DragLayer = styled(motion.div).attrs({
  initial: "hidden",
  animate: "show",
  exit: "hidden",
  variants: dragLayerVariants
})`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: rgba(${(props) => props.theme.theme}, 0.2);
  gap: 0.2rem;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(3px);

  svg {
    color: rgb(${(props) => props.theme.theme});
    font-size: 4rem;
    width: 1em;
    height: 1em;
  }
`;

const DragText = styled.p`
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  color: ${(props) => props.theme.primaryText};
  margin: 0;
`;

const CloseDragLayerButton = styled(CloseIcon)`
  position: absolute;
  font-size: 1.3rem !important;
  top: 1rem;
  right: 1rem;
  bottom: unset;
  left: unset;
  cursor: pointer;
  transition: 0.18s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.82);
  }
`;

const ErrorText = styled(Text).attrs({ size: "xs", noMargin: true })`
  top: 29px;
  right: 58%;
  position: relative;
  color: #f1655b;
`;

const KeyfileInput = styled(motion.div)`
  display: flex;
  height: 208px;
  padding: 16px 24px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  align-self: stretch;
  border-radius: 8px;
  background: ${(props) => props.theme.input.background.default.default};
  cursor: pointer;
`;

const ClickToUploadText = styled(Text).attrs({
  weight: "medium",
  noMargin: true
})`
  color: ${(props) => props.theme.input.icons.searchActive};
`;

const scaleAppearAnimation: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.6,
    transition: {
      type: "spring",
      duration: 0.4
    }
  },
  shown: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      duration: 0.4,
      delayChildren: 0.2,
      staggerChildren: 0.05
    }
  }
};

interface Props {
  /**
   * Verify mode is to verify that the
   * user wrote down their seedphrase.
   */
  verifyMode?: boolean;
  onChange?: (val: string | JWKInterface) => void;
  /**
   * Enter key press on the last word's
   * input.
   */
  onReady?: () => void;
  defaultLength?: SeedLength;
  onMnemonicLengthChange?: (length: number) => void;
  verifyWords?: Array<string | undefined>;
  inputType?: "seedphrase" | "keyfile";
  loading?: boolean;
}

type SeedLength = 12 | 24;
