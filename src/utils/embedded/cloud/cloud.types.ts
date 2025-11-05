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
