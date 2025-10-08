import { useState, useEffect, useCallback, useRef } from "react";
import type { Container, UserIdentity, RecordField, RecordToCreate, RecordToSave, Asset } from "tsl-apple-cloudkit";
import { useScript } from "~utils/script/script.hooks";
import type { AppDataFile } from "../cloud.types";
import type { JWKInterface } from "arweave/web/lib/wallet";

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
  authenticate: () => Promise<{ email: string | null }>;
  revokeAuth: () => void;

  // File operations methods
  uploadFile: (file: File | Blob, fileName: string, walletAddress: string, mimeType?: string) => Promise<AppDataFile>;
  getFileContent: (fileId: string) => Promise<JWKInterface>;
  getFile: (walletAddress: string, fileId?: string) => Promise<AppDataFile | null>;
  updateFile: (fileId: string, file: File | Blob, fileName?: string, mimeType?: string) => Promise<AppDataFile>;
  downloadFile: (fileId: string, fileName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
}

const RECORD_TYPE = "WalletBackup";

export const useAppleCloud = (containerIdentifier: string, apiToken: string): UseAppleCloudReturn => {
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
        if (!containerIdentifier || !apiToken) {
          console.error("CloudKit initialization failed: Missing required configuration");
          return;
        }

        // const environment = process.env.NODE_ENV === "development" ? "development" : "production";
        const environment = "development"; // TODO: Remove this and uncomment the above line
        console.log(`Initializing CloudKit with environment: ${environment}`);

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
              environment,
            },
          ],
          services: {
            authTokenStore: {
              putToken: (containerIdentifier: string, authToken: string) =>
                localStorage.setItem(containerIdentifier, authToken),
              getToken: (containerIdentifier: string) => localStorage.getItem(containerIdentifier) || "",
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
  }, [containerIdentifier, apiToken, status]);

  useEffect(() => {
    isAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated]);

  const authenticate = useCallback(async (): Promise<{ email: string | null }> => {
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

      if (!clickableElement) throw new Error("iCloud authentication failed.");

      // Intercept window.open to capture popup reference
      let cloudKitPopup: Window | null = null;
      const originalWindowOpen = window.open;

      window.open = function (...args) {
        const popup = originalWindowOpen.apply(this, args);
        cloudKitPopup = popup;
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

        const cleanup = () => {
          if (authCheckInterval) clearInterval(authCheckInterval);
          if (authTimeout) clearTimeout(authTimeout);
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

        // Check authentication status every 2 seconds
        authCheckInterval = setInterval(() => {
          if (isAuthenticatedRef.current || localStorage.getItem(containerIdentifier)) {
            resolveAuth(true);
          } else if (cloudKitPopup?.closed) {
            // Only show cancelled error if popup closed without successful auth
            resolveAuth(false, "iCloud authentication was cancelled. Please try again.");
          }
        }, 2000);

        // Timeout after 5 minutes
        authTimeout = setTimeout(() => {
          resolveAuth(false, "iCloud authentication timeout. Please try again.");
        }, 300000);
      });
    } catch (error) {
      const errorMessage = error?.message || error?.reason || "iCloud authentication failed.";
      throw new Error(errorMessage);
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [authState.isAuthenticated]);

  const revokeAuth = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      userIdentity: null,
      isLoading: false,
    });

    // @ts-ignore
    containerRef.current?._auth.signOut();
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

        const existingFile = await getFile(walletAddress);
        if (existingFile) return existingFile;

        const fileType = mimeType || (file instanceof File ? file.type : "application/json");

        // Create a unique record name
        const recordName = walletAddress;

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
    async (fileId: string): Promise<JWKInterface> => {
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

        const jsonData = (await downloadResponse.json()) as JWKInterface;

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
