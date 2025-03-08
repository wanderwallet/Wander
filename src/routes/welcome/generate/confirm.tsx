import { useToasts } from "@arconnect/components";
import { useContext, useEffect, useMemo, useState } from "react";
import { WalletContext, type SetupWelcomeViewParams } from "../setup";
import SeedInput from "~components/SeedInput";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Button } from "@arconnect/components-rebrand";

export type ConfirmWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function ConfirmWelcomeView({ params }: ConfirmWelcomeViewProps) {
  const { navigate } = useLocation();

  // wallet context
  const { wallet: generatedWallet } = useContext(WalletContext);

  // toasts
  const { setToast } = useToasts();

  // confirm seedphrase input state
  const [seedInputState, setSeedInputState] = useState<string>();

  // validate entered seedphrase
  function validateSeedphrase() {
    // check if the entered seedphrase is
    // the same as the one generated before
    if (!isConfirmed) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_seed"),
        duration: 2200
      });
    }

    // continue
    navigate(`/${params.setupMode}/${Number(params.page) + 1}`);
  }

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_SEEDPHRASE);
  }, []);

  // pre filled words
  const [verifyWords, setVerifyWords] = useState<string[]>();
  const isConfirmed = useMemo(
    () =>
      verifyWords &&
      verifyWords.join(" ").replaceAll(/\s+/g, " ").trim() === seedInputState,
    [seedInputState, verifyWords]
  );

  useEffect(() => {
    if (!generatedWallet.mnemonic || verifyWords) return;
    const toPreFill: {
      i: number;
      val: string;
    }[] = [];
    const words = generatedWallet.mnemonic.split(" ");
    const qtyToGenerate = words.length / 2;

    while (toPreFill.length < qtyToGenerate) {
      const index = Math.floor(Math.random() * words.length);

      if (toPreFill.find((v) => v.i === index)) continue;
      toPreFill.push({
        i: index,
        val: words[index]
      });
    }

    setVerifyWords(() => {
      const baseArray: string[] = new Array(words.length).fill("");

      for (const el of toPreFill) baseArray[el.i] = el.val;

      return baseArray;
    });
  }, [generatedWallet]);

  return (
    <Container>
      <Content>
        <Paragraph>
          {browser.i18n.getMessage("confirm_seed_paragraph")}
        </Paragraph>
        <SeedInput
          verifyMode
          onChange={(val) => {
            if (typeof val !== "string") return;
            console.log({ val });
            setSeedInputState(val);
          }}
          showHead={false}
          onReady={validateSeedphrase}
          verifyWords={verifyWords}
        />
      </Content>
      <Button fullWidth onClick={validateSeedphrase} disabled={!isConfirmed}>
        {browser.i18n.getMessage(
          isConfirmed ? "continue" : "complete_recover_phrase"
        )}
      </Button>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 24px;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
`;
