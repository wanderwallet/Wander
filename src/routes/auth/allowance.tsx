import {
  type Allowance,
  type AllowanceBigNumber,
  defaultAllowance
} from "~applications/allowance";
import Application, { type AppInfo } from "~applications/application";
import { checkPassword } from "~wallets/auth";
import { useEffect, useState } from "react";
import {
  Input,
  Section,
  Spacer,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import App from "~components/auth/App";
import Arweave from "arweave";
import styled from "styled-components";
import { defaultGateway } from "~gateways/gateway";
import BigNumber from "bignumber.js";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";

export function AllowanceAuthRequestView() {
  const arweave = new Arweave(defaultGateway);

  const { authRequest, acceptRequest, rejectRequest } =
    useCurrentAuthRequest("allowance");

  const { url } = authRequest;

  // limit input
  const limitInput = useInput();

  // allowance
  const [allowance, setAllowance] = useState<AllowanceBigNumber>();

  useEffect(() => {
    if (!allowance) return;

    limitInput.setState(arweave.ar.winstonToAr(allowance.limit.toString()));
  }, [allowance]);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await reset();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, []);

  // app data
  const [appData, setAppData] = useState<AppInfo>();

  useEffect(() => {
    (async () => {
      if (!url) return;

      // construct app
      const app = new Application(url);

      setAllowance(await app.getAllowance());
      setAppData(await app.getAppData());
    })();
  }, [url]);

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // reset spent
  async function reset() {
    // check password
    if (!(await checkPassword(passwordInput.state))) {
      passwordInput.setStatus("error");
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }

    // construct app
    const app = new Application(url);

    // update allowance
    await app.updateSettings(() => {
      const updatedAllowance: AllowanceBigNumber = {
        ...defaultAllowance,
        ...allowance
      };

      if (limitInput.state !== "") {
        const limitInputState = BigNumber(
          arweave.ar.arToWinston(limitInput.state)
        );

        if (
          !limitInputState.eq(allowance?.limit || 0) &&
          limitInputState.gt(0)
        ) {
          updatedAllowance.limit = limitInputState;
        }
      }

      updatedAllowance.spent = BigNumber("0");

      return {
        allowance: {
          enabled: updatedAllowance.enabled,
          limit: updatedAllowance.limit.toString(),
          spent: updatedAllowance.spent.toString()
        }
      };
    });

    acceptRequest();
  }

  return (
    <Wrapper>
      <div>
        <HeadAuth title={browser.i18n.getMessage("reset_allowance")} />
        <Spacer y={0.75} />
        <App
          appName={appData?.name || url}
          appUrl={url}
          appIcon={appData?.logo}
          allowance={
            allowance && {
              enabled: allowance.enabled,
              limit: allowance.limit.toFixed(),
              spent: allowance.spent.toFixed()
            }
          }
        />
        <Spacer y={1.5} />
        <Section>
          <NumberInput
            type="number"
            {...limitInput.bindings}
            label={browser.i18n.getMessage("limit")}
            placeholder={"0.1"}
            iconRight="AR"
            fullWidth
          />
          <Spacer y={1} />
          <Input
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              reset();
            }}
          />
        </Section>
      </div>
      <Section>
        <AuthButtons
          authRequest={authRequest}
          primaryButtonProps={{
            label: browser.i18n.getMessage("reset_spent"),
            onClick: reset
          }}
          secondaryButtonProps={{
            onClick: () => rejectRequest()
          }}
        />
      </Section>
    </Wrapper>
  );
}

const NumberInput = styled(Input)`
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  appearance: textfield;
`;
