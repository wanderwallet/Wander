import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import styled from "styled-components";
import { Text, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import {
  parseFramesReducer,
  areFramesComplete,
  framesToData,
  progressOfFrames
} from "qrloop";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [frames, setFrames] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setToast } = useToasts();

  const handleQRScan = (result: QrScanner.ScanResult) => {
    try {
      const newFrames = parseFramesReducer(frames, result.data);
      setFrames(newFrames);

      if (areFramesComplete(newFrames)) {
        onScan(framesToData(newFrames).toString());
      } else {
        const progress = progressOfFrames(newFrames);
        setToast({
          type: "info",
          content: `Scanning: ${Math.round(progress * 100)}%`,
          duration: 1000
        });
      }
    } catch (e) {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_qr_code"),
        duration: 2000
      });
      onError?.(browser.i18n.getMessage("invalid_qr_code"));
    }
  };

  useEffect(() => {
    const initializeScanner = async () => {
      if (!videoRef.current) return;

      try {
        const newScanner = new QrScanner(videoRef.current, handleQRScan, {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true
        });

        setScanner(newScanner);
        await newScanner.start();
      } catch (e) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("camera_permission_denied"),
          duration: 2000
        });
        onError?.(browser.i18n.getMessage("camera_permission_denied"));
      }
    };

    initializeScanner();

    // Cleanup on unmount
    return () => {
      if (scanner) {
        scanner.destroy();
        setScanner(null);
      }
    };
  }, []);

  return (
    <ScannerContainer>
      <VideoContainer>
        <Video ref={videoRef} />
      </VideoContainer>
      <Text size="sm" variant="secondary" style={{ textAlign: "center" }}>
        {frames
          ? `${browser.i18n.getMessage("scanning")}: ${Math.round(
              progressOfFrames(frames) * 100
            )}%`
          : browser.i18n.getMessage("position_qr_code")}
      </Text>
    </ScannerContainer>
  );
}

const ScannerContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 24px;
  display: flex;
  gap: 16px;
  flex: 1 0 0;
  border: 2px solid ${(props) => props.theme.theme};
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px;
`;
