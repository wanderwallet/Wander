import prettyBytes from "pretty-bytes";
import { useState, useEffect, useCallback } from "react";
import { useScript } from "~utils/script/script.hooks";

interface GoogleAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface StoredToken {
  accessToken: string;
  expiresAt: number;
  timestamp: number;
}

interface AppDataFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  isComplete: boolean;
}

interface UseGoogleDriveReturn {
  // Auth state
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;

  // File operations state
  files: AppDataFile[];
  uploadProgress: UploadProgress | null;

  // Auth methods
  authenticate: () => Promise<boolean>;
  revokeAuth: () => void;
  isTokenValid: () => boolean;
  ensureValidToken: () => Promise<string | null>;

  // File operations methods
  listFiles: () => Promise<void>;
  uploadFile: (file: File | Blob, fileName: string, mimeType?: string) => Promise<AppDataFile | null>;
  getFile: (fileId: string) => Promise<Blob | null>;
  updateFile: (fileId: string, file: File | Blob, fileName?: string, mimeType?: string) => Promise<AppDataFile | null>;
  downloadFile: (fileId: string, fileName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  clearError: () => void;
}

const TOKEN_STORAGE_KEY = "google_drive_token";
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before actual expiry

// Token management utilities
const storeToken = (accessToken: string, expiresIn: number = 3600): void => {
  const expiresAt = Date.now() + expiresIn * 1000 - TOKEN_EXPIRY_BUFFER;
  const tokenData: StoredToken = {
    accessToken,
    expiresAt,
    timestamp: Date.now(),
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
          }) => { requestAccessToken: () => void };
          revoke: (token: string) => void;
        };
      };
    };
  }
}

export const useGoogleDrive = (clientId: string): UseGoogleDriveReturn => {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    accessToken: null,
    isLoading: false,
    error: null,
  });

  const [files, setFiles] = useState<AppDataFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Initialize auth state from stored token on mount
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        setAuthState({
          isAuthenticated: true,
          accessToken: storedToken.accessToken,
          isLoading: false,
          error: null,
        });
      }
    };

    initializeAuth();
  }, []);

  // Google cloud script
  useScript("https://accounts.google.com/gsi/client", { removeOnUnmount: true });

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const authenticate = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!window.google) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Google Identity Services not loaded",
        }));
        resolve(false);
        return;
      }

      if (authState.isAuthenticated) {
        resolve(true);
        return;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      window.google.accounts.oauth2
        .initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.appdata",
          callback: (response: { error?: string; access_token?: string; expires_in?: number }) => {
            if (response.error) {
              setAuthState((prev) => ({
                ...prev,
                isLoading: false,
                error: response.error || null,
              }));
              resolve(false);
            } else {
              const accessToken = response.access_token || "";
              const expiresIn = response.expires_in || 3600; // Default to 1 hour

              // Store the token with expiry information
              storeToken(accessToken, expiresIn);

              setAuthState({
                isAuthenticated: true,
                accessToken: accessToken,
                isLoading: false,
                error: null,
              });
              resolve(true);
            }
          },
        })
        .requestAccessToken();
    });
  }, [clientId, authState.isAuthenticated]);

  const revokeAuth = useCallback(() => {
    if (authState.accessToken && window.google) {
      window.google.accounts.oauth2.revoke(authState.accessToken);
    }

    // Clear stored token
    clearStoredToken();

    setAuthState({
      isAuthenticated: false,
      accessToken: null,
      isLoading: false,
      error: null,
    });

    // Clear files when logging out
    setFiles([]);
    setUploadProgress(null);
  }, [authState.accessToken]);

  // Function to check if current token is valid
  const isTokenValid = useCallback((): boolean => {
    const storedToken = getStoredToken();
    return storedToken !== null;
  }, []);

  // Function to refresh token if needed
  const ensureValidToken = useCallback(async (): Promise<string | null> => {
    if (isTokenValid() && authState.accessToken) {
      return authState.accessToken;
    }

    // Token is invalid or expired, need to re-authenticate
    const authSuccess = await authenticate();
    if (authSuccess) {
      // Get the token from state after successful authentication
      const storedToken = getStoredToken();
      return storedToken?.accessToken || null;
    }

    return null;
  }, [authState.accessToken, isTokenValid, authenticate]);

  const listFiles = useCallback(async (): Promise<void> => {
    const token = await ensureValidToken();
    if (!token) {
      setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
      return;
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,mimeType,size,createdTime,modifiedTime)",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to list files: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const appDataFiles: AppDataFile[] = data.files.map(
        (file: {
          id: string;
          name: string;
          mimeType: string;
          size?: string;
          createdTime: string;
          modifiedTime: string;
        }) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size ? prettyBytes(parseInt(file.size)) : undefined,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
        }),
      );

      setFiles(appDataFiles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setAuthState((prev) => ({ ...prev, error: errorMessage }));
      console.error("Error listing files:", err);
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [ensureValidToken]);

  const uploadFile = useCallback(
    async (file: File | Blob, fileName: string, mimeType?: string): Promise<AppDataFile | null> => {
      const token = await ensureValidToken();
      if (!token) {
        setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
        return null;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Initialize upload progress
      setUploadProgress({
        fileName,
        progress: 0,
        isComplete: false,
      });

      try {
        const fileType = mimeType || (file instanceof File ? file.type : "application/octet-stream");

        // Create metadata for the file - specify appDataFolder as parent
        const metadata = {
          name: fileName,
          mimeType: fileType,
          parents: ["appDataFolder"], // This is key for storing in app data folder
        };

        // Create form data for multipart upload
        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", file);

        // Update progress to 50% when starting upload
        setUploadProgress((prev) => (prev ? { ...prev, progress: 50 } : null));

        const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();

        // Complete progress
        setUploadProgress((prev) => (prev ? { ...prev, progress: 100, isComplete: true } : null));

        // Clear progress after a delay
        setTimeout(() => setUploadProgress(null), 2000);

        const uploadedFile: AppDataFile = {
          id: result.id,
          name: result.name,
          mimeType: result.mimeType,
          size: result.size ? prettyBytes(parseInt(result.size)) : undefined,
          createdTime: result.createdTime,
          modifiedTime: result.modifiedTime,
        };

        // Add to files list
        setFiles((prev) => [uploadedFile, ...prev]);

        return uploadedFile;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error uploading file:", err);
        setUploadProgress(null);
        return null;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken],
  );

  const getFile = useCallback(
    async (fileId: string): Promise<Blob | null> => {
      const token = await ensureValidToken();
      if (!token) {
        setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
        return null;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to get file: ${errorData.error?.message || response.statusText}`);
        }

        const blob = await response.blob();
        return blob;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error getting file:", err);
        return null;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken],
  );

  const updateFile = useCallback(
    async (fileId: string, file: File | Blob, fileName?: string, mimeType?: string): Promise<AppDataFile | null> => {
      const token = await ensureValidToken();
      if (!token) {
        setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
        return null;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Initialize upload progress for update
      setUploadProgress({
        fileName: fileName || "file",
        progress: 0,
        isComplete: false,
      });

      try {
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

        // Update progress to 50% when starting upload
        setUploadProgress((prev) => (prev ? { ...prev, progress: 50 } : null));

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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Update failed: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();

        // Complete progress
        setUploadProgress((prev) => (prev ? { ...prev, progress: 100, isComplete: true } : null));

        // Clear progress after a delay
        setTimeout(() => setUploadProgress(null), 2000);

        const updatedFile: AppDataFile = {
          id: result.id,
          name: result.name,
          mimeType: result.mimeType,
          size: result.size ? prettyBytes(parseInt(result.size)) : undefined,
          createdTime: result.createdTime,
          modifiedTime: result.modifiedTime,
        };

        // Update the file in the files list
        setFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile : f)));

        return updatedFile;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error updating file:", err);
        setUploadProgress(null);
        return null;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken],
  );

  const downloadFile = useCallback(
    async (fileId: string, fileName: string): Promise<void> => {
      const token = await ensureValidToken();
      if (!token) {
        setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
        return;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Download failed: ${errorData.error?.message || response.statusText}`);
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
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error downloading file:", err);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken],
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      const token = await ensureValidToken();
      if (!token) {
        setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
        return;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Delete failed: ${errorData.error?.message || response.statusText}`);
        }

        // Remove from files list
        setFiles((prev) => prev.filter((file) => file.id !== fileId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error deleting file:", err);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureValidToken],
  );

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    accessToken: authState.accessToken,
    isLoading: authState.isLoading,
    error: authState.error,

    // File operations state
    files,
    uploadProgress,

    // Auth methods
    authenticate,
    revokeAuth,
    isTokenValid,
    ensureValidToken,

    // File operations methods
    listFiles,
    uploadFile,
    getFile,
    updateFile,
    downloadFile,
    deleteFile,
    clearError,
  };
};
