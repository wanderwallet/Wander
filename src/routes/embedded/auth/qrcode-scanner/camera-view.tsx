import { useWebcamPermission } from "../add-qrcode/hooks/useWebcamPermission";
import { Box, Text } from "~components/embed";
export function CameraView() {
  const { permissionStatus, isLoading, error, requestPermission } =
    useWebcamPermission();

  return <Box hasBorder style={{ width: "100%", height: "100%" }} />;
}
