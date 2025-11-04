import { useState, useEffect, useCallback, useRef } from "react";
import type { AppDataFile } from "../cloud.types";
import {
  GOOGLE_DRIVE_OAUTH_SUCCESS_MSG_TYPE,
  GOOGLE_DRIVE_OAUTH_ERROR_MSG_TYPE,
  isGoogleDriveOAuthSuccessMessage,
  isGoogleDriveOAuthErrorMessage,
  POPUP_CHECK_INTERVAL_MS,
  POPUP_AUTHENTICATION_TIMEOUT_MS,
  OAuthErrorCode,
  getAuthErrorMessage,
} from "~utils/authentication/authentication.utils";
import type { RecoveryJSON } from "~utils/embedded/embedded.types";

interface GoogleCloudAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
}

interface StoredToken {
  accessToken: string;
  expiresAt: number;
  timestamp: number;
  email: string | null;
}

interface UseGoogleCloudReturn {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;

  // Auth methods
  authenticate: () => Promise<{ email?: string | null }>;
  revokeAuth: () => Promise<void>;

  // File operations methods
  uploadFile: (file: File | Blob, fileName: string, walletAddress: string, mimeType?: string) => Promise<AppDataFile>;
  getFileContent: (fileId: string) => Promise<RecoveryJSON>;
  getFile: (walletAddress: string, fileId?: string) => Promise<AppDataFile | null>;
  updateFile: (fileId: string, file: File | Blob, fileName?: string, mimeType?: string) => Promise<AppDataFile>;
  downloadFile: (fileId: string, fileName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
}

const TOKEN_STORAGE_KEY = "google_drive_token";
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before actual expiry

const storeToken = (accessToken: string, expiresIn: number = 3600, email: string | null = null): void => {
  const expiresAt = Date.now() + expiresIn * 1000 - TOKEN_EXPIRY_BUFFER;
  const tokenData: StoredToken = {
    accessToken,
    expiresAt,
    timestamp: Date.now(),
    email,
  };
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
};

const getStoredToken = (): StoredToken | null => {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;

    const tokenData: StoredToken = JSON.parse(stored);

    // Check if token is expired
    if (Date.now() >= tokenData.expiresAt) {
      clearStoredToken();
      return null;
    }

    return tokenData;
  } catch (error) {
    console.error("Error reading stored token:", error);
    clearStoredToken();
    return null;
  }
};

const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

// OAuth configuration
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata email";
const GOOGLE_DRIVE_OAUTH_CALLBACK_URL = "/google-drive-oauth-callback.html";

const CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID;

export const useGoogleCloud = (): UseGoogleCloudReturn => {
  const accessTokenRef = useRef<string | null>(null);

  const [authState, setAuthState] = useState<GoogleCloudAuthState>(() => {
    const storedToken = getStoredToken();
    accessTokenRef.current = storedToken?.accessToken || null;
    return {
      isAuthenticated: !!storedToken,
      isLoading: false,
      email: storedToken?.email || null,
    };
  });

  useEffect(() => {
    const syncAuthState = () => {
      const storedToken = getStoredToken();
      const newIsAuthenticated = !!storedToken;
      const newAccessToken = storedToken?.accessToken || null;

      accessTokenRef.current = newAccessToken;

      setAuthState((prev) => {
        if (prev.isAuthenticated !== newIsAuthenticated) {
          return {
            ...prev,
            isAuthenticated: newIsAuthenticated,
            email: newIsAuthenticated ? prev.email : null,
          };
        }
        return prev;
      });
    };

    syncAuthState();
  }, []);

  // Function to fetch user email using the access token
  const fetchUserEmail = useCallback(async (accessToken: string): Promise<string | null> => {
    try {
      const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch user info:", response.statusText);
        return null;
      }

      const userInfo = await response.json();
      return userInfo.email || null;
    } catch (error) {
      console.error("Error fetching user email:", error);
      return null;
    }
  }, []);

  const authenticate = useCallback((): Promise<{ email: string | null }> => {
    return new Promise((resolve, reject) => {
      if (authState.isAuthenticated) {
        resolve({ email: authState.email });
        return;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Build OAuth URL
      const redirectUri = `${window.location.origin}${GOOGLE_DRIVE_OAUTH_CALLBACK_URL}`;
      const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "token",
        scope: SCOPES,
        state: "google_drive_oauth",
        prompt: "select_account", // Force account selection
        access_type: "online", // Don't allow offline access which could skip selection
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${authParams.toString()}`;

      // Calculate popup position (same as authenticateWithOAuth)
      const width = Math.min(500, document.documentElement.offsetWidth);
      const height = Math.min(600, window.screen.availHeight - 32);
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      // Open popup window
      const popup = window.open(
        authUrl,
        "Google Drive Auth",
        [
          `width=${width}`,
          `height=${height}`,
          `left=${left}`,
          `top=${top}`,
          "popup=1",
          "location=1",
          "status=1",
          "resizable=no",
          "toolbar=no",
          "menubar=no",
        ].join(","),
      );

      if (!popup) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        reject(new Error(getAuthErrorMessage(OAuthErrorCode.CANNOT_OPEN_POPUP)));
        return;
      }

      // Message handler for postMessage from callback page
      async function authCompleteMessageHandler(event: MessageEvent) {
        // Verify origin for security
        if (
          event.origin !== window.location.origin ||
          (event.data?.type !== GOOGLE_DRIVE_OAUTH_SUCCESS_MSG_TYPE &&
            event.data?.type !== GOOGLE_DRIVE_OAUTH_ERROR_MSG_TYPE)
        ) {
          return;
        }

        cleanup();
        popup.close();

        if (isGoogleDriveOAuthErrorMessage(event.data)) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          reject(new Error(event.data.errorDescription, { cause: event.data }));
          return;
        }

        if (!isGoogleDriveOAuthSuccessMessage(event.data)) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          reject(new Error(getAuthErrorMessage(OAuthErrorCode.INVALID_OAUTH_MESSAGE)));
          return;
        }

        const { accessToken, expiresIn } = event.data;

        // Fetch user email
        const email = await fetchUserEmail(accessToken);

        // Store the token
        storeToken(accessToken, expiresIn, email);
        accessTokenRef.current = accessToken;

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          email,
        });

        resolve({ email });
      }

      // Check if popup was closed manually
      let popupClosedTime: number | null = null;
      let gracePeriodTimeout: NodeJS.Timeout | null = null;

      const popupCheckInterval = setInterval(() => {
        if (popup.closed && !popupClosedTime) {
          // Popup just closed - start grace period to allow postMessage to be received
          popupClosedTime = Date.now();

          // Schedule cancellation check after grace period
          gracePeriodTimeout = setTimeout(() => {
            // If we're still here after grace period, user cancelled (postMessage never arrived)
            cleanup();
            setAuthState((prev) => ({ ...prev, isLoading: false }));
            reject(new Error(getAuthErrorMessage(OAuthErrorCode.POPUP_CLOSED)));
          }, 2000); // 2 second grace period for postMessage to arrive
        }
      }, POPUP_CHECK_INTERVAL_MS);

      // Timeout if authentication takes too long
      const timeoutId = setTimeout(() => {
        cleanup();
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        reject(new Error(getAuthErrorMessage(OAuthErrorCode.POPUP_TIMEOUT)));
      }, POPUP_AUTHENTICATION_TIMEOUT_MS);

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener("message", authCompleteMessageHandler);
        clearInterval(popupCheckInterval);
        clearTimeout(timeoutId);
        if (gracePeriodTimeout) clearTimeout(gracePeriodTimeout);
      };

      window.addEventListener("message", authCompleteMessageHandler);
    });
  }, [authState.isAuthenticated, fetchUserEmail]);

  const revokeAuth = useCallback(async () => {
    clearStoredToken();
    accessTokenRef.current = null;

    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      email: null,
    });
  }, []);

  // Function to check if current token is valid
  const isTokenValid = useCallback((): boolean => {
    const storedToken = getStoredToken();
    return storedToken !== null;
  }, []);

  // Function to refresh token if needed
  const ensureValidToken = useCallback(async (): Promise<string> => {
    if (isTokenValid() && accessTokenRef.current) return accessTokenRef.current;

    // Token is invalid or expired, need to re-authenticate
    await authenticate();

    // Get the token from state after successful authentication
    const storedToken = getStoredToken();
    return storedToken?.accessToken || null;
  }, [isTokenValid, authenticate]);

  const checkGoogleResponse = useCallback(async (response: Response): Promise<void> => {
    const { error } = await response.json().catch(() => ({ error: {} }));
    if (error?.status === "PERMISSION_DENIED") {
      clearStoredToken();
      accessTokenRef.current = null;
      setAuthState((prev) => ({ ...prev, isAuthenticated: false, isLoading: false, email: null }));
      throw new Error("Insufficient permissions - please grant required permissions");
    }
  }, []);

  const getFile = useCallback(
    async (walletAddress: string, fileId?: string): Promise<AppDataFile | null> => {
      try {
        const token = await ensureValidToken();

        const url = fileId
          ? `https://www.googleapis.com/drive/v3/files/${fileId}`
          : `https://www.googleapis.com/drive/v3/files?q=appProperties has { key: 'walletAddress', value: '${walletAddress}' }`;

        const response = await fetch(`${url}&fields=id,name,mimeType,createdTime,modifiedTime,appProperties`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get wallet backup.`);
        }

        const data = await response.json();
        return {
          id: data.id,
          name: data.name,
          mimeType: data.mimeType,
          createdTime: data.createdTime,
          modifiedTime: data.modifiedTime,
          walletAddress: data?.appProperties?.walletAddress || "",
        } as AppDataFile;
      } catch (err) {
        const errorMessage = err?.message || err?.reason || "Failed to get wallet backup.";
        console.error("Error getting file: ", errorMessage);
        return null;
      }
    },
    [ensureValidToken],
  );

  const uploadFile = useCallback(
    async (file: File | Blob, fileName: string, walletAddress: string, mimeType?: string): Promise<AppDataFile> => {
      try {
        const token = await ensureValidToken();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const existingFile = await getFile(walletAddress);
        if (existingFile) return existingFile;

        const fileType = mimeType || (file instanceof File ? file.type : "application/octet-stream");

        // Create metadata for the file - specify appDataFolder as parent
        const metadata = {
          name: fileName,
          mimeType: fileType,
          parents: ["appDataFolder"], // This is key for storing in app data folder,
          appProperties: { walletAddress },
        };

        // Create form data for multipart upload
        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", file);

        const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        if (!response.ok) {
          await checkGoogleResponse(response);
          throw new Error(`Failed to backup wallet.`);
        }

        const result = await response.json();

        const uploadedFile: AppDataFile = {
          id: result.id,
          name: result.name,
          mimeType: result.mimeType,
          createdTime: result.createdTime || new Date(),
          modifiedTime: result.modifiedTime || new Date(),
          walletAddress,
        };

        return uploadedFile;
      } catch (err) {
        const errorMessage = err?.message || err?.reason || "Failed to backup wallet.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken, checkGoogleResponse],
  );

  const getFileContent = useCallback(
    async (fileId: string): Promise<RecoveryJSON> => {
      try {
        const token = await ensureValidToken();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          await checkGoogleResponse(response);
          throw new Error("Failed to get wallet backup.");
        }

        const blob = await response.json();
        return blob as unknown as RecoveryJSON;
      } catch (err) {
        const errorMessage = err?.message || err?.reason || "Failed to get wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken, checkGoogleResponse],
  );

  const updateFile = useCallback(
    async (fileId: string, file: File | Blob, fileName?: string, mimeType?: string): Promise<AppDataFile> => {
      try {
        const token = await ensureValidToken();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const fileType = mimeType || (file instanceof File ? file.type : "application/octet-stream");

        // Create metadata for the file update
        const metadata: any = {
          mimeType: fileType,
        };

        // Only update name if provided
        if (fileName) {
          metadata.name = fileName;
        }

        // Create form data for multipart upload
        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", file);

        const response = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: form,
          },
        );

        if (!response.ok) {
          await checkGoogleResponse(response);
          throw new Error(`Failed to update wallet backup.`);
        }

        const result = await response.json();

        const updatedFile: AppDataFile = {
          id: result.id,
          name: result.name,
          mimeType: result.mimeType,
          createdTime: result.createdTime,
          modifiedTime: result.modifiedTime,
          walletAddress: result.walletAddress,
        };

        return updatedFile;
      } catch (err) {
        const errorMessage = err?.message || err?.reason || "Failed to update wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken, checkGoogleResponse],
  );

  const downloadFile = useCallback(
    async (fileId: string, fileName: string): Promise<void> => {
      try {
        const token = await ensureValidToken();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          await checkGoogleResponse(response);
          throw new Error(`Failed to get wallet backup.`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        const errorMessage = err?.message || err?.reason || "Failed to get wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken, checkGoogleResponse],
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        const token = await ensureValidToken();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          await checkGoogleResponse(response);
          throw new Error(`Failed to delete wallet backup.`);
        }
      } catch (err) {
        const errorMessage = err?.message || err?.reason || "Failed to delete wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken, checkGoogleResponse],
  );

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    email: authState.email,

    // Auth methods
    authenticate,
    revokeAuth,

    // File operations methods
    uploadFile,
    getFileContent,
    getFile,
    updateFile,
    downloadFile,
    deleteFile,
  };
};
