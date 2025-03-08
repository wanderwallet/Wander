import {
  Button,
  Spacer,
  type ButtonProps
} from "@arconnect/components-rebrand";
import { useThrottledRequestAnimationFrame } from "@swyg/corre";
import { useRef, type MouseEvent } from "react";
import styled from "styled-components";
import type { AuthRequest, AuthRequestStatus } from "~utils/auth/auth.types";
import { prettyDate } from "~utils/pretty_date";
import browser from "webextension-polyfill";

interface AuthButtonProps extends ButtonProps {
  label?: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

export interface AuthButtonsProps {
  authRequest?: AuthRequest;
  primaryButtonProps?: AuthButtonProps;
  secondaryButtonProps?: AuthButtonProps;
  showAuthStatus?: boolean;
}

// TODO: Consider creating a similar component without the `authRequest` to be reused everywhere where the "continue"
// or "cancel" labels below are found:

export function AuthButtons({
  authRequest,
  primaryButtonProps,
  secondaryButtonProps,
  showAuthStatus = true
}: AuthButtonsProps) {
  const showPrimaryButton = !!primaryButtonProps?.onClick;
  const showSecondaryButton = !!secondaryButtonProps?.onClick;
  const primaryButtonLabel =
    primaryButtonProps?.label || browser.i18n.getMessage("continue");
  const secondaryButtonLabel =
    secondaryButtonProps?.label || browser.i18n.getMessage("cancel");

  // TODO: Consider using the red `<ResetButton>` for cancel.

  const requestedAt = authRequest?.requestedAt;
  const requestedAtElementRef = useRef<HTMLSpanElement>();

  useThrottledRequestAnimationFrame(() => {
    const requestedAtElement = requestedAtElementRef.current;

    if (!requestedAtElement) return;

    requestedAtElement.textContent = prettyDate(requestedAt);

    // TODO: After one minute, change the interval wait time to 5 seconds or so. Consider adding this to @swyg/corre and adding a function/hook useFormattedTime
  }, 250);

  // TODO: Display the active wallet inside `<PStatusLabel>` too:

  return (
    <>
      {showAuthStatus && authRequest ? (
        <PStatusLabel status={authRequest.status}>
          {browser.i18n.getMessage(`${authRequest.status}TransactionStatusAt`) +
            " "}
          <span ref={requestedAtElementRef}>{prettyDate(requestedAt)}</span>
        </PStatusLabel>
      ) : null}

      {!authRequest || authRequest.status === "pending" ? (
        <>
          {showPrimaryButton || showSecondaryButton ? (
            <Spacer y={0.75} />
          ) : null}

          {showPrimaryButton ? (
            <Button {...primaryButtonProps} fullWidth>
              {primaryButtonLabel}
            </Button>
          ) : null}

          {showPrimaryButton && showSecondaryButton ? (
            <Spacer y={0.75} />
          ) : null}

          {showSecondaryButton ? (
            <Button {...secondaryButtonProps} variant="secondary" fullWidth>
              {secondaryButtonLabel}
            </Button>
          ) : null}
        </>
      ) : null}
    </>
  );
}

const PStatusLabel = styled.p<{ status: AuthRequestStatus }>`
  margin: 0;
  padding: 16px;
  background: ${(props) => props.theme.surfaceSecondary};
  color: ${(props) => props.theme.primaryText};
  border-radius: 10px;
  font-weight: 500;
`;
