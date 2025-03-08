import type { SignatureOptions } from "arweave/node/lib/crypto/crypto-interface";
import { type PermissionType, permissionData } from "~applications/permissions";
import type { SplitTransaction } from "~api/modules/sign/transaction_builder";
import type { SignMessageOptions } from "~api/modules/sign_message/types";
import type { SignatureAlgorithm } from "~api/modules/signature/types";
import type { RawDataItem } from "~api/modules/sign_data_item/types";
import type { DecryptedWallet, LocalWallet } from "~wallets";
import type { TokenType } from "~tokens/token";
import type { JWKInterface } from "arweave/web/lib/wallet";
import type Transaction from "arweave/web/lib/transaction";
import type { DecodedTag } from "~api/modules/sign/tags";
import type { AppInfo } from "~applications/application";
import type { Chunk } from "~api/modules/sign/chunks";
import { isAddressFormat } from "./format";
import type {
  EncryptionAlgorithm,
  LegacyEncryptionOptions
} from "~api/modules/encrypt/types";
import type { ApiCall } from "shim";
import {
  assert,
  isNumber,
  isOneOf,
  isRecordWithKeys,
  isString,
  isArrayOfType,
  isArray,
  isRecord,
  isInstanceOf,
  isOneOfType,
  isNotUndefined,
  isNotNull,
  isExactly
} from "typed-assert";
import type { Gateway } from "~gateways/gateway";
import {
  RecurringPaymentFrequency,
  type SubscriptionData
} from "~subscriptions/subscription";
import { ERR_MSG_USER_CANCELLED_AUTH } from "~utils/auth/auth.constants";

export function isGateway(input: unknown): asserts input is Gateway {
  isRecordWithKeys(
    input,
    ["host", "port", "protocol"],
    "A gateway object should only have the following keys: host, port, protocol."
  );
  isString(input.host, "Gateway host should be a string.");
  isNumber(input.port, "Gateway port should be a number.");
  isOneOf(
    input.protocol,
    ["http", "https"],
    "Gateway protocol should be https/http."
  );
}

export function isSubscriptionType(
  input: unknown
): asserts input is SubscriptionData {
  isInstanceOf(input, Object, "Input should be an object.");

  const {
    arweaveAccountAddress,
    applicationName,
    subscriptionName,
    subscriptionFeeAmount,
    recurringPaymentFrequency,
    subscriptionEndDate,
    applicationIcon
  } = input as SubscriptionData;

  isString(arweaveAccountAddress, "arweaveAccountAddress should be a string.");
  isString(applicationName, "applicationName should be a string.");
  isString(subscriptionName, "subscriptionName should be a string.");
  isNumber(subscriptionFeeAmount, "subscriptionFeeAmount should be a number.");
  isOneOf(
    recurringPaymentFrequency,
    Object.values(RecurringPaymentFrequency),
    "Invalid recurringPaymentFrequency."
  );

  validateDate(subscriptionEndDate, "Invalid subscriptionEndDate date.");

  if (applicationIcon !== undefined) {
    isString(applicationIcon, "applicationIcon should be a string.");
  }
}

function validateDate(date: string | Date, errorMessage: string): void {
  let dateString: string;

  if (date instanceof Date) {
    dateString = date.toISOString();
  } else {
    dateString = date;
  }

  if (!dateString || isNaN(Date.parse(dateString))) {
    throw new Error(errorMessage);
  }
}

export function isTokenType(input: unknown): asserts input is TokenType {
  isString(input, "Token type should be a string.");
  isOneOf(
    input,
    ["asset", "collectible"],
    "Token type should be asset/collectible."
  );
}

export function isAddress(input: unknown): asserts input is string {
  isString(input, "Address or ID should be a string.");
  assert(isAddressFormat(input), "Invalid address or ID format.");
}

export function isPermissionsArray(
  input: unknown
): asserts input is PermissionType[] {
  isArray(input, "Input has to be an array of permissions.");
  isArrayOfType(input, isPermission, "Permission array has an invalid member.");
}

export function isPermission(input: unknown): asserts input is PermissionType {
  isString(input, "Permission has to be a string.");
  isOneOf(
    input,
    Object.keys(permissionData),
    "Input is not a valid permission."
  );
}

export function isAppInfo(input: unknown): asserts input is AppInfo {
  isRecord(input, "App info has to be a Record<string, any>.");

  const allowedFields = ["name", "logo"];

  for (const key in input) {
    isOneOf(key, allowedFields, `"${key}" is not a valid field for AppInfo.`);
  }
}

export function isSplitTransaction(
  input: unknown
): asserts input is SplitTransaction {
  const stringKeys = [
    "id",
    "last_tx",
    "owner",
    "target",
    "quantity",
    "data_size",
    "data_root",
    "reward",
    "signature"
  ];

  isRecordWithKeys(
    input,
    [...stringKeys, "format", "chunks"],
    "A key is missing from the raw transaction object."
  );

  for (const key of stringKeys) {
    isString(input[key], `"${key}" of transaction has to be a string.`);
  }

  isNumber(input.format, "format of transaction has to be a number.");
  isRecordWithKeys(
    input.chunks,
    ["data_root", "chunks", "proofs"],
    "Invalid transaction chunk format."
  );
}

export function isRawTransaction(input: unknown): asserts input is Transaction {
  isSplitTransaction(input);
  isInstanceOf(
    input.data,
    Uint8Array,
    "Transaction data has to be Uint8Array."
  );
  isArrayOfType(input.tags, isTag, "Invalid tags array.");
}

export function isTag(input: unknown): asserts input is DecodedTag {
  try {
    isRecordWithKeys(input, ["name", "value"], "Invalid keys in tag.");
  } catch {
    throw new Error(
      `Issue with ${JSON.stringify(
        input
      )}, please ensure that "name" and "value" exist on all tags`
    );
  }
  isString(input.name, "Tag name has to be a string");
  isString(input.value, "Tag value has to be a string.");
}

export function isSignatureOptions(
  input: unknown
): asserts input is SignatureOptions {
  isRecord(input, "Signature options has to be a record.");

  if (typeof input.saltLength !== "undefined") {
    isNumber(input.saltLength, "Salt length has to be a number.");
  }
}

export function isChunk(input: unknown): asserts input is Chunk {
  isRecord(input, "Chunk has to be a record.");
  isString(input.collectionID, "Chunk collection ID has to be a string.");
  isOneOf(input.type, ["tag", "data", "start", "end"], "Invalid chunk type.");
  isNumber(input.index, "Chunk index has to be a number.");

  if (input.value) {
    isOneOfType(
      input.value,
      [isNumberArray, isTag],
      "Chunk value has to be a tag or a raw typed array."
    );
  }
}

export function isNumberArray(input: unknown): asserts input is number[] {
  isArrayOfType(input, isNumber, "Array can only contain numbers.");
}

export function isApiCall(
  input: unknown
): asserts input is ApiCall<{ params: any[] }> {
  isRecord(input, "Api call has to be a record.");
  isString(input.callID, "Call ID has to be a string.");
  isString(input.type, "Message type has to be a string.");
}

export function isEncryptionAlgorithm(
  input: unknown
): asserts input is EncryptionAlgorithm {
  isNotUndefined(input, "Algorithm cannot be undefined.");
  isNotNull(input, "Algorithm cannot be null.");

  if (typeof input === "string") return;

  isRecord(input, "Algorithm needs to be a string on a record.");
  isString(input.name, "Algorithm name needs to be a string.");
}

export function isLegacyEncryptionOptions(
  input: unknown
): asserts input is LegacyEncryptionOptions {
  isNotUndefined(input, "Encryption options have to be defined.");
  isRecord(input, "Encryption options have to be a record.");
  isString(input.algorithm, "Encryption algorithm has to be a string.");
  isString(input.hash, "Encryption hash has to be a string.");

  if (input.salt) isString(input.salt, "Encryption salt has to be a string.");
}

export function isSignMessageOptions(
  input: unknown
): asserts input is SignMessageOptions {
  isNotUndefined(input, "Options cannot be undefined.");
  isRecordWithKeys(
    input,
    ["hashAlgorithm"],
    "Sign message options has to be a record."
  );
  isOneOf(
    input.hashAlgorithm,
    ["SHA-256", "SHA-384", "SHA-512"],
    "Invalid hash algorithm."
  );
}

export function isArrayBuffer(input: unknown): asserts input is ArrayBuffer {
  isNotUndefined("Data has to be defined.");
  assert(ArrayBuffer.isView(input), "Input is not an ArrayBuffer.");
}

export function isRawArrayBuffer(
  input: unknown
): asserts input is { [i: number]: number } {
  assert(typeof input === "object", "Input has to be an object.");
  isNotNull(input, "Input cannot be null.");

  for (const key of Object.keys(input as Record<number, number>)) {
    isNumber(Number(key), "Invalid array buffer index.");
    assert(!Number.isNaN(Number[key]), "Invalid array buffer index: NaN.");
    isNumber(input[key], "Invalid array buffer byte.");
  }
}

export function isLocalWallet(
  input: DecryptedWallet
): asserts input is LocalWallet<JWKInterface> {
  isExactly(
    input.type,
    "local",
    "Hardware wallets don't support this API method currently."
  );
}

export function isRawDataItem(input: unknown): asserts input is RawDataItem {
  isRecord(input, "Raw data item has to be a record.");
  isNumberArray(input.data);

  if (input.target) isAddress(input.target);
  if (input.anchor) isString(input.anchor, "Anchor needs to be a string.");

  if (input.tags) isArrayOfType(input.tags, isTag, "Invalid tags array.");
}

export function isSignatureAlgorithm(
  input: unknown
): asserts input is SignatureAlgorithm {
  isEncryptionAlgorithm(input);
}

export function isNull(
  input: unknown,
  message?: string
): asserts input is null {
  assert(input === null, message);
}

export function isUndefined(
  input: unknown,
  message?: string
): asserts input is undefined {
  assert(typeof input === "undefined", message);
}

export function isValidBalance(input: unknown): asserts input is number {
  isOneOfType(input, [isNumber, isNull, isUndefined], "Invalid balance.");
}

export function isNotEmptyArray(input: unknown): asserts input is unknown[] {
  isArray(input, "Input is not an array.");
  assert(input.length > 0, "Array is empty.");
}

export function isValidURL(
  input: unknown,
  message?: string
): asserts input is string {
  isString(input, message);
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new TypeError(message);
  }

  isOneOf(url.protocol, ["http:", "https:"], message);
}

export function isNotCancelError(input: unknown): asserts input is Error {
  let message = "";

  if (typeof input === "string") message = input;
  else if (input instanceof Error) message = input.message;

  assert(
    !message.includes(ERR_MSG_USER_CANCELLED_AUTH),
    "User cancelled the operation"
  );
}
