import { useState, useEffect, useCallback, useRef } from "react";
import type { Container, UserIdentity, RecordField, RecordToCreate, RecordToSave, Asset } from "tsl-apple-cloudkit";
import { useScript } from "~utils/script/script.hooks";
import { CloudProvider, type AppDataFile, type PendingOperation } from "../cloud.types";
import type { RecoveryJSON } from "~utils/embedded/embedded.types";
import { fileToId } from "../cloud.utils";
import { AUTH_REDIRECT_FLAG, CLOUD_PROVIDER_STORAGE_KEY, storePendingOperation } from "../cloud.utils";

interface AppleAuthState {
  isAuthenticated: boolean;
  userIdentity: UserIdentity | null;
  isLoading: boolean;
}

interface UseAppleCloudReturn {
  // Auth state
  isAuthenticated: boolean;
  userIdentity: UserIdentity | null;
  isLoading: boolean;

  // Auth methods
  authenticate: (pendingOperation?: PendingOperation) => Promise<{ email: string | null }>;
  revokeAuth: () => Promise<void>;

  // File operations methods
  uploadFile: (file: File | Blob, fileName: string, walletAddress: string, mimeType?: string) => Promise<AppDataFile>;
  getFileContent: (fileId: string) => Promise<RecoveryJSON>;
  getFile: (walletAddress: string, fileId?: string) => Promise<AppDataFile | null>;
  updateFile: (fileId: string, file: File | Blob, fileName?: string, mimeType?: string) => Promise<AppDataFile>;
  downloadFile: (fileId: string, fileName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
}

const RECORD_TYPE = "WalletBackup";

const CONTAINER_IDENTIFIER = import.meta.env?.VITE_APPLE_CONTAINER_IDENTIFIER;
const API_TOKEN = import.meta.env?.VITE_APPLE_API_TOKEN;
const ENVIRONMENT = import.meta.env?.VITE_APPLE_ENVIRONMENT || "development";

export const useAppleCloud = (): UseAppleCloudReturn => {
  const [authState, setAuthState] = useState<AppleAuthState>({
    isAuthenticated: false,
    userIdentity: null,
    isLoading: false,
  });

  const containerRef = useRef<Container>(null);
  const isAuthenticatedRef = useRef(false);

  const status = useScript("https://cdn.apple-cloudkit.com/ck/2/cloudkit.js", { removeOnUnmount: true });

  useEffect(() => {
    const initializeCloudKit = async () => {
      try {
        if (!CONTAINER_IDENTIFIER || !API_TOKEN) {
          console.error("CloudKit initialization failed: Missing required configuration");
          return;
        }

        console.log(`Initializing CloudKit with environment: ${ENVIRONMENT}`);

        const cloudKit = window.CloudKit.configure({
          containers: [
            {
              containerIdentifier: CONTAINER_IDENTIFIER,
              apiTokenAuth: {
                apiToken: API_TOKEN,
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
              environment: ENVIRONMENT,
            },
          ],
          services: {
            authTokenStore: {
              putToken: (containerIdentifier: string, authToken: string) => {
                if (!authToken) {
                  localStorage.removeItem(containerIdentifier);
                } else {
                  localStorage.setItem(containerIdentifier, authToken);
                }
              },
              getToken: (containerIdentifier: string) => localStorage.getItem(containerIdentifier),
            },
          },
        });

        const container = cloudKit.getDefaultContainer();
        containerRef.current = container;

        const userIdentity = await container.setUpAuth();
        if (userIdentity) {
          setAuthState({
            isAuthenticated: true,
            userIdentity,
            isLoading: false,
          });
        }

        container.whenUserSignsIn().then(async (user: UserIdentity) => {
          isAuthenticatedRef.current = true;
          setAuthState({
            isAuthenticated: true,
            userIdentity: user,
            isLoading: false,
          });
        });

        container.whenUserSignsOut().then(() => {
          isAuthenticatedRef.current = false;
          setAuthState({
            isAuthenticated: false,
            userIdentity: null,
            isLoading: false,
          });
        });
      } catch (error) {
        console.error("Error initializing CloudKit: ", error);
      }
    };

    if (status !== "ready") return;

    initializeCloudKit();
  }, [status]);

  useEffect(() => {
    isAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated]);

  // Check for authentication completion from redirect flow
  useEffect(() => {
    const checkAuthFromStorage = () => {
      if (!CONTAINER_IDENTIFIER) return;

      const authToken = localStorage.getItem(CONTAINER_IDENTIFIER);
      if (authToken && !authState.isAuthenticated) {
        // Token exists but we're not authenticated - might be from redirect
        // Try to set up auth again to sync state
        if (containerRef.current) {
          containerRef.current.setUpAuth().then((userIdentity) => {
            if (userIdentity) {
              setAuthState({
                isAuthenticated: true,
                userIdentity,
                isLoading: false,
              });
            }
          });
        }
      }
    };

    // Check immediately
    checkAuthFromStorage();

    // Also listen for storage changes (cross-tab sync)
    const storageListener = (e: StorageEvent) => {
      if (e.key === CONTAINER_IDENTIFIER) {
        checkAuthFromStorage();
      }
    };
    window.addEventListener("storage", storageListener);

    // Poll periodically in case storage event doesn't fire
    const pollInterval = setInterval(checkAuthFromStorage, 1000);

    return () => {
      window.removeEventListener("storage", storageListener);
      clearInterval(pollInterval);
    };
  }, [authState.isAuthenticated]);

  const authenticate = useCallback(
    async (pendingOperation?: PendingOperation): Promise<{ email: string | null }> => {
      try {
        if (!containerRef.current) {
          throw new Error("iCloud not initialized.");
        }

        if (authState.isAuthenticated) return { email: null };

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const userIdentity = await containerRef.current.setUpAuth();

        if (userIdentity) {
          setAuthState({
            isAuthenticated: true,
            userIdentity,
            isLoading: false,
          });
          return { email: null };
        }

        // User needs to authenticate via popup
        const signInButton = document.getElementById("apple-sign-in-button");
        const clickableElement = signInButton?.children[0] as HTMLElement;

        if (!clickableElement) throw new Error("iCloud authentication failed. Please try again.");

        // Intercept window.open to capture popup reference
        let cloudKitPopup: Window | null = null;
        const originalWindowOpen = window.open;

        window.open = function (...args) {
          const popup = originalWindowOpen.apply(this, args);
          cloudKitPopup = popup;

          // Check if popup was blocked
          if (!popup || popup.closed || typeof popup.closed === "undefined") {
            try {
              localStorage.setItem(AUTH_REDIRECT_FLAG, "true");
              localStorage.setItem(CLOUD_PROVIDER_STORAGE_KEY, CloudProvider.APPLE);
              if (pendingOperation) {
                storePendingOperation(pendingOperation);
              }
            } catch (error) {
              console.error("Error saving redirect state:", error);
            }
            window.location.href = args[0] as string;
            return;
          }

          return popup;
        };

        clickableElement.click();

        // Restore original window.open
        setTimeout(() => {
          window.open = originalWindowOpen;
        }, 1000);

        // Monitor authentication completion
        return new Promise((resolve, reject) => {
          let authCheckInterval: NodeJS.Timeout | null = null;
          let authTimeout: NodeJS.Timeout | null = null;
          let popupClosedTime: number | null = null;
          let gracePeriodTimeout: NodeJS.Timeout | null = null;

          const cleanup = () => {
            if (authCheckInterval) clearInterval(authCheckInterval);
            if (authTimeout) clearTimeout(authTimeout);
            if (gracePeriodTimeout) clearTimeout(gracePeriodTimeout);
          };

          const resolveAuth = (success: boolean, error?: string) => {
            cleanup();
            setAuthState((prev) => ({
              ...prev,
              isAuthenticated: success,
              isLoading: false,
            }));
            if (error) reject(new Error(error));
            resolve({ email: null });
          };

          // Check authentication status every 500ms for faster response
          authCheckInterval = setInterval(() => {
            const authToken = localStorage.getItem(CONTAINER_IDENTIFIER);
            if (isAuthenticatedRef.current || authToken) {
              resolveAuth(true);
            } else if (cloudKitPopup?.closed && !popupClosedTime) {
              // Popup just closed - start grace period
              popupClosedTime = Date.now();

              // Schedule cancellation check after grace period
              gracePeriodTimeout = setTimeout(() => {
                // Double-check auth state after grace period
                if (!isAuthenticatedRef.current && !authToken) {
                  resolveAuth(false, "iCloud authentication was cancelled. Please try again.");
                }
              }, 2000); // 2 second grace period
            }
          }, 500);

          // Timeout after 5 minutes
          authTimeout = setTimeout(() => {
            resolveAuth(false, "iCloud authentication timeout. Please try again.");
          }, 300000);
        });
      } catch (error) {
        const errorMessage = error?.message || error?.reason || "iCloud authentication failed. Please try again.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [authState.isAuthenticated],
  );

  const revokeAuth = useCallback(async () => {
    try {
      setAuthState({
        isAuthenticated: false,
        userIdentity: null,
        isLoading: false,
      });

      // @ts-ignore
      await containerRef.current?._auth.signOut();
    } catch {
      localStorage.removeItem(CONTAINER_IDENTIFIER);
    }
  }, []);

  const ensureIsAuthenticated = useCallback(async () => {
    if (isAuthenticatedRef.current) return;

    await authenticate();
  }, [authenticate]);

  const uploadFile = useCallback(
    async (file: File | Blob, fileName: string, walletAddress: string, mimeType?: string): Promise<AppDataFile> => {
      try {
        await ensureIsAuthenticated();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const contentId = await fileToId(file);
        const existingFile = await getFile(contentId);
        if (existingFile) return existingFile;

        const fileType = mimeType || (file instanceof File ? file.type : "application/json");

        // Create a unique record name
        const recordName = contentId;

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

        const response = await containerRef.current.privateCloudDatabase.saveRecords([record]);

        if (response.records.length === 0) {
          throw new Error("Failed to save record.");
        }

        const savedRecord = response.records[0];

        const fields = savedRecord.fields as { [name: string]: RecordField };
        const uploadedFile: AppDataFile = {
          id: savedRecord.recordName,
          name: (fields.fileName?.value as string) || fileName,
          mimeType: fileType,
          createdTime: savedRecord.created ? new Date(savedRecord.created.timestamp).toISOString() : "",
          modifiedTime: savedRecord.modified ? new Date(savedRecord.modified.timestamp).toISOString() : "",
          walletAddress: (fields.walletAddress?.value as string) || walletAddress,
        };

        return uploadedFile;
      } catch (err: any) {
        let errorMessage = err?.message || err?.reason || "Failed to backup wallet.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureIsAuthenticated],
  );

  const getFileContent = useCallback(
    async (fileId: string): Promise<RecoveryJSON> => {
      try {
        await ensureIsAuthenticated();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await containerRef.current.privateCloudDatabase.fetchRecords([fileId]);

        if (response.records.length === 0) {
          throw new Error("Wallet backup not found.");
        }

        const record = response.records[0];
        const fields = record.fields as { [name: string]: RecordField };
        const asset = fields.fileAsset?.value as Asset;

        if (!asset) {
          throw new Error("Wallet backup not found.");
        }

        const downloadResponse = await fetch(asset.downloadURL);
        if (!downloadResponse.ok) {
          throw new Error("Failed to get wallet backup.");
        }

        const jsonData = (await downloadResponse.json()) as RecoveryJSON;

        return jsonData;
      } catch (err: any) {
        let errorMessage = err?.message || err?.reason || "Failed to get wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureIsAuthenticated],
  );

  const getFile = useCallback(
    async (walletAddress: string, fileId?: string): Promise<AppDataFile | null> => {
      try {
        await ensureIsAuthenticated();

        const response = await containerRef.current.privateCloudDatabase.fetchRecords([walletAddress || fileId]);

        if (response.records.length === 0) {
          throw new Error("Wallet backup not found.");
        }

        const record = response.records[0];
        const fields = record.fields as { [name: string]: RecordField };
        const asset = fields.fileAsset?.value as Asset;

        if (!asset) {
          throw new Error("Wallet backup not found.");
        }

        return {
          id: record.recordName,
          name: (fields.fileName?.value as string) || "Unknown",
          mimeType: "application/json",
          createdTime: record.created ? new Date(record.created.timestamp).toISOString() : "",
          modifiedTime: record.modified ? new Date(record.modified.timestamp).toISOString() : "",
          walletAddress: record.recordName || "Unknown",
        };
      } catch (err) {
        console.error("Error getting wallet backup:", err);
        return null;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureIsAuthenticated],
  );

  const updateFile = useCallback(
    async (fileId: string, file: File | Blob, fileName?: string, mimeType?: string): Promise<AppDataFile> => {
      try {
        await ensureIsAuthenticated();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const fileType = mimeType || (file instanceof File ? file.type : "application/json");

        // First, fetch the existing record to get its current state
        const fetchResponse = await containerRef.current.privateCloudDatabase.fetchRecords([fileId]);

        if (fetchResponse.records.length === 0) {
          throw new Error("Wallet backup not found.");
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

        const response = await containerRef.current.privateCloudDatabase.saveRecords([updatedRecord]);

        if (response.records.length === 0) {
          throw new Error("Failed to update record.");
        }

        const savedRecord = response.records[0];

        const fields = savedRecord.fields as { [name: string]: RecordField };
        const updatedFile: AppDataFile = {
          id: savedRecord.recordName,
          name: (fields.fileName?.value as string) || fileName || "Unknown",
          mimeType: fileType,
          createdTime: savedRecord.created ? new Date(savedRecord.created.timestamp).toISOString() : "",
          modifiedTime: savedRecord.modified ? new Date(savedRecord.modified.timestamp).toISOString() : "",
          walletAddress: fields.walletAddress?.value as string,
        };

        return updatedFile;
      } catch (err: any) {
        let errorMessage = err?.message || err?.reason || "Failed to update wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureIsAuthenticated],
  );

  const downloadFile = useCallback(
    async (fileId: string, fileName: string): Promise<void> => {
      try {
        await ensureIsAuthenticated();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const jsonData = await getFileContent(fileId);
        if (!jsonData) {
          throw new Error("Failed to get wallet backup.");
        }

        const blob = new Blob([JSON.stringify(jsonData)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err: any) {
        let errorMessage = err?.message || err?.reason || "Failed to get wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [getFileContent, ensureIsAuthenticated],
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        await ensureIsAuthenticated();

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        await containerRef.current.privateCloudDatabase.deleteRecords([fileId]);
      } catch (err: any) {
        let errorMessage = err?.message || err?.reason || "Failed to delete wallet backup.";
        throw new Error(errorMessage);
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureIsAuthenticated],
  );

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    userIdentity: authState.userIdentity,
    isLoading: authState.isLoading,

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
