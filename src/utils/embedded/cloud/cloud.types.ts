export enum CloudProvider {
  iCloud = "iCloud",
  GoogleCloud = "Google Cloud",
}

export interface AppDataFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  walletAddress: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  isComplete: boolean;
}
