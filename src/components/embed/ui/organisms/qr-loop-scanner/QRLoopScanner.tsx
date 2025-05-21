import styles from "./QRLoopScanner.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import QrReader from "react-qr-reader";
import browser from "webextension-polyfill";
import { parseFramesReducer, areFramesComplete, framesToData, progressOfFrames } from "qrloop";
import { CameraOffIcon } from "@iconicicons/react";
import { toast } from "react-toastify";
import { Spacer, Text } from "~components/embed";
import { Loading } from "@arconnect/components";

interface QRScannerProps {
  onResult: (result: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

interface QRLoopState {
  frames: any[];
  fountainsQueue: any[];
  exploredFountains: string[];
}

export function QRLoopScanner({ onResult, onError, onProgress }: QRScannerProps) {
  const framesRef = useRef<QRLoopState | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [cameraAllowed, setCameraAllowed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const isWebWorkerAvailable = useMemo(() => typeof Worker !== "undefined", [Worker]);

  useEffect(() => {
    (async () => {
      // get if camera permission is granted
      const cameraPerms = await navigator.permissions.query({
        name: "camera" as PermissionName,
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
      const frames = (framesRef.current = parseFramesReducer(framesRef.current, data));

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
      toast.error(browser.i18n.getMessage("invalid_qr_code"));
      onError?.(browser.i18n.getMessage("invalid_qr_code"));
    }
  };

  const handleError = () => {
    toast.error(browser.i18n.getMessage("scan_error"));
    onError?.(browser.i18n.getMessage("scan_error"));
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={styles.scannerContainer}>
      <div className={styles.videoContainer}>
        {(isLoading || !isWebWorkerAvailable) && (
          <div className={styles.loadingSection}>
            {cameraAllowed ? (
              <>
                <Loading className={styles.loadingCamera} />
                <Spacer y={0.85} />
                <Text variant="bodySm" style={{ textAlign: "center" }}>
                  {browser.i18n.getMessage("keystone_loading_camera")}
                </Text>
              </>
            ) : (
              <>
                <CameraOffIcon className={styles.deniedCamera} />
                <Spacer y={0.85} />
                <Text variant="bodySm" style={{ textAlign: "center" }}>
                  {browser.i18n.getMessage("keystone_disabled_camera")}
                </Text>
              </>
            )}
          </div>
        )}
        {isWebWorkerAvailable && (
          /* @ts-ignore - QrReader component type issue */
          <QrReader
            onScan={handleScan}
            onError={handleError}
            onLoad={handleLoad}
            delay={100}
            style={{ width: "100%" }}
            showViewFinder={false}
          />
        )}
      </div>
      <Text variant="bodySm" style={{ textAlign: "center", marginTop: 8 }}>
        {browser.i18n.getMessage("progress")}: {Math.round(progress * 100)}%
      </Text>
    </div>
  );
}
