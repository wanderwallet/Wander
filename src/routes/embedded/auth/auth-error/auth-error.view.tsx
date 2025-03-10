import {
  Box,
  Button,
  Card,
  Text,
  WanderIcon,
  Row,
  ErrorIcon
} from "~components/embed";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useSearchParams } from "~wallets/router/router.utils";
import { useEffect, useState } from "react";

interface ErrorState {
  code: string;
  description: string;
  friendlyMessage: string;
}

export default function AuthErrorEmbeddedView() {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const searchParams = useSearchParams<{
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    const error = searchParams.error || "unknown_error";
    const errorDescription =
      searchParams.error_description ||
      "An unexpected authentication error occurred";

    setErrorState({
      code: error,
      description: errorDescription,
      friendlyMessage: getFriendlyErrorMessage(error, errorDescription)
    });
  }, [searchParams]);

  const getFriendlyErrorMessage = (
    error: string,
    description: string
  ): string => {
    // First check if it's a database error from the description
    if (description.includes("Database error")) {
      return "We're experiencing database connectivity issues. Please try again in a few moments.";
    }

    // Check for specific error codes in description (e.g., "500: Database error")
    const errorCode = description.split(":")[0];
    if (errorCode === "500") {
      return "Our authentication service is temporarily unavailable. Please try again later.";
    }

    const errorMap: Record<string, string> = {
      server_error:
        "There was a problem connecting to the authentication service. This could be due to network issues or server maintenance.",
      invalid_request:
        "The authentication request was invalid. This might happen if the session expired or required information was missing.",
      access_denied:
        "Access was denied. This usually happens if you declined permissions or the authentication was cancelled.",
      unauthorized_client:
        "This application is not authorized to perform this operation. Please contact support if this persists.",
      invalid_grant:
        "The authentication credentials were invalid or expired. Please try again with valid credentials.",
      invalid_scope:
        "The requested permissions were invalid or insufficient. Please try again and ensure all required permissions are granted.",
      temporarily_unavailable:
        "The authentication service is temporarily unavailable. Please try again in a few moments.",
      unknown_error:
        "An unexpected error occurred during authentication. Please try again or contact support if the issue persists."
    };

    // If we have a specific message for this error code, use it
    if (errorMap[error]) {
      return errorMap[error];
    }

    // If no specific mapping, clean up and return the description
    return description
      .replace(/\+/g, " ")
      .replace(/^\d+:\s*/, "") // Remove error codes like "500: "
      .replace(/Database error/i, "Authentication error"); // Make database errors more user-friendly
  };

  const handleRetry = () => {
    // Remove error params from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");

    // Keep the hash part but change it to auth path
    url.hash = EmbeddedPaths.Auth;

    // Update the URL and reload
    window.location.href = url.toString();
  };

  if (!errorState) return null;

  return (
    <Card
      headerText="Authentication Failed"
      footerElement={
        <Row>
          <Text variant="bodyXs" style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={false}
      size="auto"
    >
      <Box>
        <Row
          alignment="center"
          justifyContent="center"
          style={{ marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}
        >
          <ErrorIcon fontSize={48} />
        </Row>

        <Text variant="bodyMd" style={{ marginBottom: 8 }}>
          Error Code: {errorState.code}
        </Text>

        <Text variant="bodySm" style={{ marginBottom: 24 }}>
          {errorState.friendlyMessage}
        </Text>

        <Button
          isFullWidth
          variant="primary"
          onClick={handleRetry}
          style={{ marginBottom: 16 }}
        >
          Try Again
        </Button>

        <Button isFullWidth variant="secondary" onClick={() => window.close()}>
          Close Window
        </Button>

        <Text variant="bodyXs" style={{ marginTop: 24, textAlign: "center" }}>
          If you continue to experience issues, please try:
        </Text>

        <ul style={{ listStyleType: "disc", paddingLeft: 20, marginTop: 8 }}>
          <li>
            <Text variant="bodyXs">Clearing your browser cache</Text>
          </li>
          <li>
            <Text variant="bodyXs">
              Using a different authentication method
            </Text>
          </li>
          <li>
            <Text variant="bodyXs">
              Contacting support with error code: {errorState.code}
            </Text>
          </li>
        </ul>
      </Box>
    </Card>
  );
}
