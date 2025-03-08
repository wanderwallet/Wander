import React from "react";

import styled from "styled-components";
import browser from "webextension-polyfill";
import { ButtonV2, Text } from "@arconnect/components";
import { navigate } from "wouter/use-browser-location";

interface FallbackViewProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

function handleReload() {
  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") return;

  // ONLY BROWSER EXTENSION BELOW THIS LINE:

  browser.runtime.reload();
}

export const FallbackView: React.FC<FallbackViewProps> = ({
  error,
  errorInfo
}) => {
  const isDEV = process.env.NODE_ENV === "development";

  return (
    <DivWrapper>
      <Text heading>{browser.i18n.getMessage("fallback")}</Text>
      {isDEV && (
        <ErrorWrapper>
          <Text>{error?.toString()}</Text>
          <Text>{`${browser.i18n.getMessage("commonErrorInfo")}: ${
            errorInfo?.componentStack
          }`}</Text>
        </ErrorWrapper>
      )}
      <ButtonV2 onClick={handleReload}>
        {browser.i18n.getMessage("reload")}
      </ButtonV2>
    </DivWrapper>
  );
};

const DivWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;
const ErrorWrapper = styled(DivWrapper)`
  margin: 10vh;
  height: 20vh;
`;
