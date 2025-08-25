import { ExtensionStorage } from "~utils/storage";
import { TRANSAK_PURCHASE_IDS_PREFIX, TRANSAK_PURCHASE_TIMESTAMP_PREFIX } from "./transak.constants";

export async function getTransakPurchaseIds(address: string): Promise<string[]> {
  const transakPurchaseIds = await ExtensionStorage.get<string[]>(`${TRANSAK_PURCHASE_IDS_PREFIX}${address}`);
  return transakPurchaseIds || [];
}

export async function setTransakPurchaseIds(address: string, ids: string[]): Promise<void> {
  await ExtensionStorage.set(`${TRANSAK_PURCHASE_IDS_PREFIX}${address}`, ids);
}

export async function getTransakPurchaseTimestamp(address: string): Promise<number> {
  const timestamp = await ExtensionStorage.get<number>(`${TRANSAK_PURCHASE_TIMESTAMP_PREFIX}${address}`);
  return timestamp || 0;
}

export async function setTransakPurchaseTimestamp(address: string, timestamp: number): Promise<void> {
  await ExtensionStorage.set(`${TRANSAK_PURCHASE_TIMESTAMP_PREFIX}${address}`, timestamp);
}
