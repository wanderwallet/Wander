import { useEffect, useRef, useState } from "react";
import QrReader from "react-qr-reader";
import styled from "styled-components";
import { Text, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import {
  parseFramesReducer,
  areFramesComplete,
  framesToData,
  progressOfFrames
} from "qrloop";
import { CameraOffIcon } from "@iconicicons/react";
import { Loading, Spacer } from "@arconnect/components-rebrand";

interface QRScannerProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export default function QRLoopScanner({
  onResult,
  onError,
  onProgress
}: QRScannerProps) {
  const framesRef = useRef<Record<string, string> | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [cameraAllowed, setCameraAllowed] = useState(true);
  const { setToast } = useToasts();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // get if camera permission is granted
      const cameraPerms = await navigator.permissions.query({
        // @ts-expect-error
        name: "camera"
      });

      const listener = () => {
        setCameraAllowed(cameraPerms.state === "granted");

        if (cameraPerms.state !== "granted") return;
      };

      setCameraAllowed(cameraPerms.state === "granted");

      // listen for camera permission changes
      cameraPerms.addEventListener("change", listener);

      return () => cameraPerms.removeEventListener("change", listener);
    })();
  }, []);

  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  const handleScan = (data: string | null) => {
    if (!data || progress === 1) return;

    try {
      const frames = (framesRef.current = parseFramesReducer(
        framesRef.current,
        data
      ));

      if (areFramesComplete(frames)) {
        setProgress(1);
        const finalData = framesToData(frames).toString();
        onResult(JSON.parse(finalData));
        framesRef.current = null;
      } else {
        setProgress(progressOfFrames(frames));
      }
    } catch (e) {
      console.error("QR parsing error:", e);
      framesRef.current = null;
      setProgress(0);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_qr_code"),
        duration: 2000
      });
      onError?.(browser.i18n.getMessage("invalid_qr_code"));
    }
  };

  const handleError = () => {
    setToast({
      type: "error",
      content: browser.i18n.getMessage("scan_error"),
      duration: 2000
    });
    onError?.(browser.i18n.getMessage("scan_error"));
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <ScannerContainer>
      <VideoContainer>
        {isLoading && (
          <LoadingSection>
            {cameraAllowed ? (
              <>
                <LoadingCamera />
                <Spacer y={0.85} />
                <Text
                  size="sm"
                  variant="secondary"
                  style={{ textAlign: "center" }}
                >
                  {browser.i18n.getMessage("keystone_loading_camera")}
                </Text>
              </>
            ) : (
              <>
                <DeniedCamera />
                <Spacer y={0.85} />
                <Text
                  size="sm"
                  variant="secondary"
                  style={{ textAlign: "center" }}
                >
                  {browser.i18n.getMessage("keystone_disabled_camera")}
                </Text>
              </>
            )}
          </LoadingSection>
        )}
        <QrReader
          onScan={handleScan}
          onError={handleError}
          onLoad={handleLoad}
          delay={100}
          style={{ width: "100%" }}
          showViewFinder={false}
        />
      </VideoContainer>
      <Text size="sm" variant="secondary" style={{ textAlign: "center" }}>
        {browser.i18n.getMessage("progress")}: {Math.round(progress * 100)}%
      </Text>
    </ScannerContainer>
  );
}

export const ScannerContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

export const VideoContainer = styled.div`
  width: 100%;
  height: 350px;
  aspect-ratio: 1;
  border-radius: 24px;
  display: flex;
  gap: 16px;
  border: 2px solid ${(props) => props.theme.theme};
  overflow: hidden;
  box-sizing: border-box;
`;

const LoadingSection = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: 50%;
  left: 50%;
  width: 90%;
  transform: translate(-50%, -50%);
  z-index: 1;
`;

const LoadingCamera = styled(Loading)`
  color: ${(props) => props.theme.theme};
  width: 1.85rem;
  height: 1.85rem;
`;

const DeniedCamera = styled(CameraOffIcon)`
  font-size: 2rem;
  width: 1em;
  height: 1em;
  color: ${(props) => props.theme.theme};
`;
