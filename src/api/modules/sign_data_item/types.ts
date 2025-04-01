import type { DataItemCreateOptions } from "@dha-team/arbundles";

export interface SignDataItemParams extends DataItemCreateOptions {
  data: string | Uint8Array;
}

export interface RawDataItem extends DataItemCreateOptions {
  data: number[];
}
