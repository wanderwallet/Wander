import { useState, useEffect, useCallback, useRef } from "react";
import { useScript } from "~utils/script/script.hooks";
import type { AppDataFile } from "../cloud.types";
import type { JWKInterface } from "arweave/web/lib/wallet";

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
  revokeAuth: () => void;

  // File operations methods
  uploadFile: (file: File | Blob, fileName: string, walletAddress: string, mimeType?: string) => Promise<AppDataFile>;
  getFileContent: (fileId: string) => Promise<JWKInterface>;
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

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { error?: string; access_token?: string; expires_in?: number }) => void;
            error_callback: (error: any) => void;
          }) => { requestAccessToken: () => void };
          revoke: (token: string) => void;
        };
      };
    };
  }
}

export const useGoogleCloud = (clientId: string): UseGoogleCloudReturn => {
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
            email: newIsAuthenticated ? prev.email : null, // Clear email when not authenticated
          };
        }
        return prev;
      });
    };

    syncAuthState();
  }, []);

  // Google cloud script
  useScript("https://accounts.google.com/gsi/client", { removeOnUnmount: true });

  // Function to fetch user email using the access token
  const fetchUserEmail = useCallback(async (accessToken: string): Promise<string | null> => {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
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
      if (!window.google) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        reject(new Error("Google authentication failed. Please try again."));
      }

      if (authState.isAuthenticated) {
        resolve({ email: authState.email });
        return;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true }));

      window.google.accounts.oauth2
        .initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.appdata email",
          callback: async (response: { error?: string; access_token?: string; expires_in?: number }) => {
            if (response.error) {
              setAuthState((prev) => ({ ...prev, isLoading: false }));
              reject(new Error(response.error || "Google authentication failed. Please try again."));
            } else {
              const accessToken = response.access_token || "";
              const expiresIn = response.expires_in || 3600; // Default to 1 hour

              // Fetch user email
              const email = await fetchUserEmail(accessToken);

              // Store the token with expiry information
              storeToken(accessToken, expiresIn, email);

              // Update ref immediately
              accessTokenRef.current = accessToken;

              setAuthState((prev) => ({
                ...prev,
                isAuthenticated: true,
                isLoading: false,
                email,
              }));
              resolve({ email });
            }
          },
          error_callback: (error) => {
            setAuthState((prev) => ({ ...prev, isLoading: false }));
            if (!error?.type) return;
            switch (error.type) {
              case "popup_failed_to_open":
                reject(new Error("Failed to open Google authentication popup. Please try again."));
                break;
              case "popup_closed":
                reject(new Error("Google authentication was cancelled. Please try again."));
                break;
              default:
                reject(new Error(error?.message || "Google authentication failed. Please try again."));
                break;
            }
          },
        })
        .requestAccessToken();
    });
  }, [clientId, authState.isAuthenticated]);

  const revokeAuth = useCallback(() => {
    if (accessTokenRef.current && window.google) {
      window.google.accounts.oauth2.revoke(accessTokenRef.current);
    }

    // Clear stored token and ref
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
    async (fileId: string): Promise<JWKInterface> => {
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
        return blob as JWKInterface;
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
