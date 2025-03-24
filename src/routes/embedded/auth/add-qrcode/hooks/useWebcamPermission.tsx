import { useState, useEffect, useCallback } from "react";

/**
 * Permission statuses for webcam access
 */
type PermissionStatus = "prompt" | "granted" | "denied" | "not-supported";

/**
 * Custom hook for managing webcam permission
 * @returns Object with permission status, loading state, and request function
 */
export function useWebcamPermission() {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("prompt");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the browser supports mediaDevices API
  const isSupported =
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    !!navigator.mediaDevices.getUserMedia;

  // Initialize permission status based on browser support
  useEffect(() => {
    if (!isSupported) {
      setPermissionStatus("not-supported");
    }
  }, [isSupported]);

  // Request webcam permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError("Camera API is not supported in this browser");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request video stream (this triggers permission dialog)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // If we get here, permission was granted
      setPermissionStatus("granted");

      // Stop all tracks to release the camera
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (err) {
      // Handle different error types
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermissionStatus("denied");
          setError("Camera access was denied");
        } else {
          setError(`Error accessing camera: ${err.message}`);
        }
      } else {
        setError("Unknown error occurred when accessing camera");
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Check for existing permissions
  useEffect(() => {
    // If the Permissions API is available, check current permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === "granted") {
            setPermissionStatus("granted");
          } else if (permissionStatus.state === "denied") {
            setPermissionStatus("denied");
          } else {
            setPermissionStatus("prompt");
          }

          // Listen for changes to permission state
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state as PermissionStatus);
          };
        })
        .catch(() => {
          // If permissions API fails, we'll rely on the getUserMedia request
          console.log(
            "Permissions API not fully supported, will use getUserMedia for permission check"
          );
        });
    }
  }, []);

  return {
    permissionStatus,
    isLoading,
    error,
    requestPermission
  };
}
