import prettyBytes from "pretty-bytes";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Container, UserIdentity, RecordField, Query, RecordToCreate, RecordToSave } from "tsl-apple-cloudkit";
import { useScript } from "~utils/script/script.hooks";

interface AppleAuthState {
  isAuthenticated: boolean;
  userIdentity: UserIdentity | null;
  isLoading: boolean;
  error: string | null;
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

interface UseAppleDriveReturn {
  // Auth state
  isAuthenticated: boolean;
  userIdentity: UserIdentity | null;
  isLoading: boolean;
  error: string | null;

  // File operations state
  files: AppDataFile[];
  uploadProgress: UploadProgress | null;

  // Auth methods
  authenticate: () => Promise<boolean>;
  revokeAuth: () => void;

  // File operations methods
  listFiles: () => Promise<void>;
  uploadFile: (file: File | Blob, fileName: string, mimeType?: string) => Promise<AppDataFile | null>;
  getFile: (fileId: string) => Promise<Blob | null>;
  updateFile: (fileId: string, file: File | Blob, fileName?: string, mimeType?: string) => Promise<AppDataFile | null>;
  downloadFile: (fileId: string, fileName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  clearError: () => void;
}

const RECORD_TYPE = "WalletBackup";

export const useAppleDrive = (containerIdentifier: string, apiToken: string): UseAppleDriveReturn => {
  const [authState, setAuthState] = useState<AppleAuthState>({
    isAuthenticated: false,
    userIdentity: null,
    isLoading: false,
    error: null,
  });

  const [files, setFiles] = useState<AppDataFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const containerRef = useRef<Container>(null);
  const isAuthenticatedRef = useRef(false);

  const status = useScript("https://cdn.apple-cloudkit.com/ck/2/cloudkit.js", { removeOnUnmount: true });

  useEffect(() => {
    const initializeCloudKit = async () => {
      try {
        const cloudKit = window.CloudKit.configure({
          containers: [
            {
              containerIdentifier,
              apiTokenAuth: {
                apiToken,
                persist: true,
                signInButton: {
                  id: "apple-sign-in-button",
                  theme: "black",
                },
                signOutButton: {
                  id: "apple-sign-out-button",
                  theme: "black",
                },
              },

              // TODO: Change to production when ready
              environment: "development",
            },
          ],
        });

        const container = cloudKit.getDefaultContainer();
        containerRef.current = container;

        try {
          const userIdentity = await container.fetchCurrentUserIdentity();
          if (userIdentity) {
            setAuthState({
              isAuthenticated: true,
              userIdentity,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error("Error fetching user identity:", error);
        }

        container.whenUserSignsIn().then(async (user: UserIdentity) => {
          setAuthState({
            isAuthenticated: true,
            userIdentity: user,
            isLoading: false,
            error: null,
          });
        });

        container.whenUserSignsOut().then(() => {
          setAuthState({
            isAuthenticated: false,
            userIdentity: null,
            isLoading: false,
            error: null,
          });
        });
      } catch (error) {
        console.error("Error initializing CloudKit:", error);
        setAuthState((prev) => ({
          ...prev,
          error: "Failed to initialize CloudKit",
        }));
      }
    };

    if (status !== "ready") return;

    initializeCloudKit();
  }, [containerIdentifier, apiToken, status]);

  useEffect(() => {
    isAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated]);

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const triggerSignIn = useCallback(async (): Promise<boolean> => {
    if (!containerRef.current) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "CloudKit not initialized",
      }));
      return false;
    }

    if (authState.isAuthenticated) return true;

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // First, try to get current user identity
      const userIdentity = await containerRef.current.fetchCurrentUserIdentity();

      if (userIdentity) {
        setAuthState({
          isAuthenticated: true,
          userIdentity,
          isLoading: false,
          error: null,
        });
        return true;
      }
    } catch (error) {
      try {
        const signInButton = document.getElementById("apple-sign-in-button");
        if (signInButton) {
          const clickableElement = signInButton.children[0] as HTMLElement;
          if (clickableElement) {
            clickableElement.click();

            // Wait for authentication to complete
            return new Promise((resolve) => {
              const checkAuth = async () => {
                try {
                  const userIdentity = await containerRef.current!.fetchCurrentUserIdentity();
                  if (userIdentity) {
                    setAuthState({
                      isAuthenticated: true,
                      userIdentity,
                      isLoading: false,
                      error: null,
                    });
                    resolve(true);
                  } else {
                    // Check again in 1 second
                    setTimeout(checkAuth, 5000);
                  }
                } catch (error) {
                  // Still not authenticated, check again
                  setTimeout(checkAuth, 5000);
                }
              };

              // Start checking after a short delay
              setTimeout(checkAuth, 5000);

              // Timeout after 30 seconds
              setTimeout(() => {
                setAuthState((prev) => ({
                  ...prev,
                  isLoading: false,
                  error: "Authentication timeout. Please try again.",
                }));
                resolve(false);
              }, 300000);
            });
          }
        }

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Please complete the sign in process",
        }));
        return false;
      } catch (signInError) {
        console.error("Error during signin flow:", signInError);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Sign in failed. Please try again.",
        }));
        return false;
      }
    }

    return false;
  }, [authState.isAuthenticated]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!containerRef.current) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "CloudKit not initialized",
      }));
      return false;
    }

    if (authState.isAuthenticated) return true;

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const userIdentity = await containerRef.current.setUpAuth();

      if (userIdentity) {
        setAuthState({
          isAuthenticated: true,
          userIdentity,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        return await triggerSignIn();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [authState.isAuthenticated, triggerSignIn]);

  const revokeAuth = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      userIdentity: null,
      isLoading: false,
      error: null,
    });

    // Clear files when logging out
    setFiles([]);
    setUploadProgress(null);

    // @ts-ignore
    containerRef.current?._auth.signOut();
  }, []);

  const listFiles = useCallback(async (): Promise<void> => {
    if (!isAuthenticatedRef.current || !containerRef.current) {
      setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
      return;
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const query: Query = {
        recordType: RECORD_TYPE,
        sortBy: [
          {
            fieldName: "modifiedTimestamp",
            ascending: false,
          },
        ],
      };

      const response = await containerRef.current.privateCloudDatabase.performQuery(query);

      const appDataFiles: AppDataFile[] = response.records.map((record) => {
        const fields = record.fields as { [name: string]: RecordField };
        const asset = fields.fileAsset?.value as any; // Asset object from CloudKit

        return {
          id: record.recordName,
          name: (fields.fileName?.value as string) || "Unknown",
          mimeType: "application/octet-stream", // Default since we don't store it
          size: asset?.fileSize ? prettyBytes(asset.fileSize) : undefined,
          createdTime: record.created ? new Date(record.created.timestamp).toISOString() : "",
          modifiedTime: record.modified ? new Date(record.modified.timestamp).toISOString() : "",
        };
      });

      setFiles(appDataFiles);
    } catch (err: any) {
      let errorMessage = "Unknown error occurred";

      if (err && typeof err === "object") {
        if (err.serverErrorCode) {
          errorMessage = `CloudKit Error: ${err.serverErrorCode} - ${err.reason || err.message}`;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setAuthState((prev) => ({ ...prev, error: errorMessage }));
      console.error("Error listing files:", err);
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [authState.isAuthenticated]);

  const uploadFile = useCallback(
    async (file: File | Blob, fileName: string, mimeType?: string): Promise<AppDataFile | null> => {
      if (!isAuthenticatedRef.current || !containerRef.current) {
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
        const fileSize = file.size;

        // Create a unique record name
        const recordName = `wallet-backup-1`;

        // Update progress to 30% when preparing asset
        setUploadProgress((prev) => (prev ? { ...prev, progress: 30 } : null));

        // Create the record with minimal data - CloudKit handles the rest
        const record: RecordToCreate = {
          recordName,
          recordType: RECORD_TYPE,
          fields: {
            fileName: {
              value: fileName,
              type: "STRING",
            },
            fileAsset: {
              value: file,
              type: "ASSETID",
            },
          },
        };

        // Update progress to 50% when starting upload
        setUploadProgress((prev) => (prev ? { ...prev, progress: 50 } : null));

        const response = await containerRef.current.privateCloudDatabase.saveRecords([record]);

        if (response.records.length === 0) {
          throw new Error("Failed to save record");
        }

        const savedRecord = response.records[0];

        // Complete progress
        setUploadProgress((prev) => (prev ? { ...prev, progress: 100, isComplete: true } : null));

        // Clear progress after a delay
        setTimeout(() => setUploadProgress(null), 2000);

        const fields = savedRecord.fields as { [name: string]: RecordField };
        const uploadedFile: AppDataFile = {
          id: savedRecord.recordName,
          name: (fields.fileName?.value as string) || fileName,
          mimeType: fileType, // Use the original file type
          size: prettyBytes(fileSize), // Use the original file size
          createdTime: savedRecord.created ? new Date(savedRecord.created.timestamp).toISOString() : "",
          modifiedTime: savedRecord.modified ? new Date(savedRecord.modified.timestamp).toISOString() : "",
        };

        // Add to files list
        setFiles((prev) => [uploadedFile, ...prev]);

        return uploadedFile;
      } catch (err: any) {
        let errorMessage = "Unknown error occurred";

        if (err && typeof err === "object") {
          if (err.serverErrorCode) {
            errorMessage = `CloudKit Error: ${err.serverErrorCode} - ${err.reason || err.message}`;
          } else if (err.message) {
            errorMessage = err.message;
          }
        }

        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error uploading file:", err);
        setUploadProgress(null);
        return null;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  const getFile = useCallback(async (fileId: string): Promise<Blob | null> => {
    if (!isAuthenticatedRef.current || !containerRef.current) {
      setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
      return null;
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await containerRef.current.privateCloudDatabase.fetchRecords([fileId]);

      if (response.records.length === 0) {
        throw new Error("File not found");
      }

      const record = response.records[0];
      const fields = record.fields as { [name: string]: RecordField };
      const asset = fields.fileAsset?.value as Blob;

      if (!asset) {
        throw new Error("File asset not found");
      }

      return asset;
    } catch (err: any) {
      let errorMessage = "Unknown error occurred";

      if (err && typeof err === "object") {
        if (err.serverErrorCode) {
          errorMessage = `CloudKit Error: ${err.serverErrorCode} - ${err.reason || err.message}`;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setAuthState((prev) => ({ ...prev, error: errorMessage }));
      console.error("Error getting file:", err);
      return null;
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const updateFile = useCallback(
    async (fileId: string, file: File | Blob, fileName?: string, mimeType?: string): Promise<AppDataFile | null> => {
      if (!isAuthenticatedRef.current || !containerRef.current) {
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
        const fileSize = file.size;

        // First, fetch the existing record to get its current state
        const fetchResponse = await containerRef.current.privateCloudDatabase.fetchRecords([fileId]);

        if (fetchResponse.records.length === 0) {
          throw new Error("File not found");
        }

        const existingRecord = fetchResponse.records[0];

        // Update the record with minimal data - CloudKit handles the rest
        const updatedRecord: RecordToSave = {
          ...existingRecord,
          fields: {
            ...existingRecord.fields,
            fileAsset: {
              value: file,
              type: "ASSETID",
            },
          },
        };

        // Only update fileName if provided
        if (fileName) {
          (updatedRecord.fields as { [name: string]: RecordField }).fileName = {
            value: fileName,
            type: "STRING",
          };
        }

        // Update progress to 50% when starting upload
        setUploadProgress((prev) => (prev ? { ...prev, progress: 50 } : null));

        const response = await containerRef.current.privateCloudDatabase.saveRecords([updatedRecord]);

        if (response.records.length === 0) {
          throw new Error("Failed to update record");
        }

        const savedRecord = response.records[0];

        // Complete progress
        setUploadProgress((prev) => (prev ? { ...prev, progress: 100, isComplete: true } : null));

        // Clear progress after a delay
        setTimeout(() => setUploadProgress(null), 2000);

        const fields = savedRecord.fields as { [name: string]: RecordField };
        const updatedFile: AppDataFile = {
          id: savedRecord.recordName,
          name: (fields.fileName?.value as string) || fileName || "Unknown",
          mimeType: fileType, // Use the original file type
          size: prettyBytes(fileSize), // Use the original file size
          createdTime: savedRecord.created ? new Date(savedRecord.created.timestamp).toISOString() : "",
          modifiedTime: savedRecord.modified ? new Date(savedRecord.modified.timestamp).toISOString() : "",
        };

        // Update the file in the files list
        setFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile : f)));

        return updatedFile;
      } catch (err: any) {
        let errorMessage = "Unknown error occurred";

        if (err && typeof err === "object") {
          if (err.serverErrorCode) {
            errorMessage = `CloudKit Error: ${err.serverErrorCode} - ${err.reason || err.message}`;
          } else if (err.message) {
            errorMessage = err.message;
          }
        }

        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error updating file:", err);
        setUploadProgress(null);
        return null;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  const downloadFile = useCallback(
    async (fileId: string, fileName: string): Promise<void> => {
      if (!isAuthenticatedRef.current || !containerRef.current) {
        setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
        return;
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const blob = await getFile(fileId);
        if (!blob) {
          throw new Error("Failed to get file");
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err: any) {
        let errorMessage = "Unknown error occurred";

        if (err && typeof err === "object") {
          if (err.serverErrorCode) {
            errorMessage = `CloudKit Error: ${err.serverErrorCode} - ${err.reason || err.message}`;
          } else if (err.message) {
            errorMessage = err.message;
          }
        }

        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        console.error("Error downloading file:", err);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [getFile],
  );

  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    if (!isAuthenticatedRef.current || !containerRef.current) {
      setAuthState((prev) => ({ ...prev, error: "Authentication required" }));
      return;
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await containerRef.current.privateCloudDatabase.deleteRecords([fileId]);

      // Remove from files list
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch (err: any) {
      let errorMessage = "Unknown error occurred";

      if (err && typeof err === "object") {
        if (err.serverErrorCode) {
          errorMessage = `CloudKit Error: ${err.serverErrorCode} - ${err.reason || err.message}`;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setAuthState((prev) => ({ ...prev, error: errorMessage }));
      console.error("Error deleting file:", err);
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    userIdentity: authState.userIdentity,
    isLoading: authState.isLoading,
    error: authState.error,

    // File operations state
    files,
    uploadProgress,

    // Auth methods
    authenticate,
    revokeAuth,

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
