import {
  Box,
  Button,
  Card,
  Text,
  WanderIcon,
  Row,
  ErrorIcon
} from "~components/embed";
import { useErrorHandler } from "./hooks/useErrorHandler";

export default function AuthErrorEmbeddedView() {
  const { errorState, handleRetry } = useErrorHandler();

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
          style={{ marginBottom: 8 }}
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
