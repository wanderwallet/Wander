export enum CloudProvider {
  APPLE = "APPLE",
  GOOGLE = "GOOGLE",
}

export interface AppDataFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  walletAddress: string;
}

export enum CloudOperationType {
  STORE = "STORE",
  DELETE = "DELETE",
  IMPORT = "IMPORT",
}

export interface PendingOperation {
  type: CloudOperationType;
  walletAddress?: string;
  fileId?: string;
  provider: CloudProvider;
}
