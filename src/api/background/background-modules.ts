import type { Module } from "../module";

// import modules
import permissionsModule from "../modules/permissions";
import permissions from "../modules/permissions/permissions.background";
import activeAddressModule from "../modules/active_address";
import activeAddress from "../modules/active_address/active_address.background";
import allAddressesModule from "../modules/all_addresses";
import allAddresses from "../modules/all_addresses/all_addresses.background";
import publicKeyModule from "../modules/public_key";
import publicKey from "../modules/public_key/public_key.background";
import walletNamesModule from "../modules/wallet_names";
import walletNames from "../modules/wallet_names/wallet_names.background";
import arweaveConfigModule from "../modules/arweave_config";
import arweaveConfig from "../modules/arweave_config/arweave_config.background";
import disconnectModule from "../modules/disconnect";
import disconnect from "../modules/disconnect/disconnect.background";
import connectModule from "../modules/connect";
import connect from "../modules/connect/connect.background";
import signModule from "../modules/sign";
import sign from "../modules/sign/sign.background";
import dispatchModule from "../modules/dispatch";
import dispatch from "../modules/dispatch/dispatch.background";
import encryptModule from "../modules/encrypt";
import encrypt from "../modules/encrypt/encrypt.background";
import decryptModule from "../modules/decrypt";
import decrypt from "../modules/decrypt/decrypt.background";
import signatureModule from "../modules/signature";
import signature from "../modules/signature/signature.background";
import addTokenModule from "../modules/add_token";
import addToken from "../modules/add_token/add_token.background";
import isTokenAddedModule from "../modules/is_token_added";
import isTokenAdded from "../modules/is_token_added/is_token_added.background";
import signMessageModule from "../modules/sign_message";
import signMessage from "../modules/sign_message/sign_message.background";
import privateHashModule from "../modules/private_hash";
import privateHash from "../modules/private_hash/private_hash.background";
import verifyMessageModule from "../modules/verify_message";
import verifyMessage from "../modules/verify_message/verify_message.background";
import signDataItemModule from "../modules/sign_data_item";
import signDataItem from "../modules/sign_data_item/sign_data_item.background";
import batchSignDataItemModule from "../modules/batch_sign_data_item";
import batchSignDataItem from "../modules/batch_sign_data_item/batch_sign_data_item.background";
import subscriptionModule from "../modules/subscription";
import subscription from "../modules/subscription/subscription.background";
import userTokensModule from "../modules/user_tokens";
import userTokens from "../modules/user_tokens/user_tokens.background";
import tokenBalanceModule from "../modules/token_balance";
import tokenBalance from "../modules/token_balance/token_balance.background";

export interface ModuleAppData {
  tabID: number;
  url: string;
  favicon?: string;
}

/**
 * Extended module function
 */
export type BackgroundModuleFunction<ResultType> = (
  appData: ModuleAppData,
  ...params: any[]
) => Promise<ResultType> | ResultType;

/** Extended module interface */
export interface BackgroundModule<T> extends Module<T> {
  function: BackgroundModuleFunction<T>;
}

/** Background modules */
export const backgroundModules: BackgroundModule<any>[] = [
  { ...permissionsModule, function: permissions },
  { ...activeAddressModule, function: activeAddress },
  { ...allAddressesModule, function: allAddresses },
  { ...publicKeyModule, function: publicKey },
  { ...walletNamesModule, function: walletNames },
  { ...arweaveConfigModule, function: arweaveConfig },
  { ...disconnectModule, function: disconnect },
  { ...connectModule, function: connect },
  { ...addTokenModule, function: addToken },
  { ...isTokenAddedModule, function: isTokenAdded },
  { ...signModule, function: sign },
  { ...dispatchModule, function: dispatch },
  { ...encryptModule, function: encrypt },
  { ...decryptModule, function: decrypt },
  { ...signatureModule, function: signature },
  { ...signMessageModule, function: signMessage },
  { ...privateHashModule, function: privateHash },
  { ...verifyMessageModule, function: verifyMessage },
  { ...signDataItemModule, function: signDataItem },
  { ...subscriptionModule, function: subscription },
  { ...userTokensModule, function: userTokens },
  { ...tokenBalanceModule, function: tokenBalance },
  { ...batchSignDataItemModule, function: batchSignDataItem },
];
