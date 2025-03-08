# Wander

Wander is a browser extension allowing Arweave wallet holders to interact with dApps securely and easily.

## API

You can interact with basic Wander functionalities using [`arweave-js`](https://npmjs.com/arweave). To create a transaction, you just don't pass in the user's wallet instance:

```ts
const tx = await arweave.createTransaction({
  /* config */
});
```

Than, you can use Wander to add the users wallet to the transaction and sign it (as before, you don't pass in the user's wallet instance, that is done by Wander):

```ts
await arweave.transactions.sign(tx);
```

Done! Now you can post the transaction.

## Events

Wander has some useful custom events.

### `arweaveWalletLoaded`

Triggers when the Wander global object (`window.arweaveWallet`) is injected into the page. It can be useful when executing functions on page load.

```ts
window.addEventListener("arweaveWalletLoaded", () => {
  /** Handle Wander load event **/
});
```

### `walletSwitch`

Triggers, when the user switches their wallet in the Wander extension popup.

```ts
window.addEventListener("walletSwitch", (e) => {
  const newAddress = e.detail.address;
  /** Handle wallet switch **/
});
```

Requires the `ACCESS_ADDRESS` and the `ACCESS_ALL_ADDRESSES` [permissions](#permissions).

## Other supported functions

Wander supports much more with it's powerful API. These features are not integrated into arweave-js right now, but please let us know if you would like to see them added or not. You can access all of these using the global `window.arweaveWallet` object (`window.arweaveWallet.getActiveAddress()`, etc.).

All of these functions are asynchronous, so you will need to `await` them. If you are using Typescript, read [this](#typescript-types) for type declarations.

### `connect(permissions, appInfo?, gateway?)`

Connect to Wander and request permissions. This function can always be called again if you want to request more permissions for your site. See the available permissions [here](#permissions).

- `permissions`: An array of [permissions](#permissions)
- `appInfo`: Optional information about your application (see the [format](#app-info))
- `gateway`: Optional gateway configuration (see the [format](#gateway-config))

#### App info

```ts
{
  name?: string; // optional application name
  logo?: string; // optional application logo
}
```

#### Gateway config

```ts
{
  host: string;
  port: number;
  protocol: "http" | "https";
}
```

### `disconnect()`

Disconnect from Wander. Removes all permissions from your site.

### `getActiveAddress(): Promise<string>`

Get the currently used wallet's address in the extension.

- `returns`: A wallet address

Requires the `ACCESS_ADDRESS` [permission](#permissions).

### `getActivePublicKey(): Promise<string>`

Get the user's active public key, from their wallet

- `returns`: The active public key

Requires the `ACCESS_PUBLIC_KEY` [permission](#permissions).

### `getAllAddresses(): Promise<string[]>`

Get all addresses added to the Wander extension

- `returns`: A list of the added wallets' addresses.

Requires the `ACCESS_ALL_ADDRESSES` [permission](#permissions).

### `getWalletNames(): Promise<{ [addr: string]: string }>`

Get wallet names for addresses.

- `returns`: An object with addresses and wallet names

Requires the `ACCESS_ALL_ADDRESSES` [permission](#permissions).

### `sign(transaction, options?): Promise<Transaction>`

Sign a transaction. Raw version of what is used in the `arweave-js` [API](#api).

- `transaction`: A valid Arweave transaction without a wallet keyfile added to it
- `options`: Arweave signing options
  <br />
- `returns`: Signed transaction instance

Requires the `SIGN_TRANSACTION` [permission](#permissions).

> Note: if you are trying to sign a larger chunk of data (5 MB <), make sure to notify the user to not switch / close browser tabs. Signing large datas takes longer and the browser won't send the chunks to the signer in the background.

### `dispatch(transaction): Promise<DispatchResult>`

Dispatches (signs and sends) a transaction to the network, preferably by bundling it. Best for smaller interactions (< 120 Kbs).

- `transaction`: A valid Arweave transaction without a wallet keyfile added to it
  <br />
- `returns`: Dispatch result (id and submit type)

Requires the `DISPATCH` [permission](#permissions).

### `encrypt(data, algorithm): Promise<Uint8Array>`

Encrypt data with the user's wallet. This is an implementation of the [webcrypto encrypt API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt).

- `data`: `BufferSource` to encrypt
- `algorithm`: Encrypt [algorithm](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#parameters)
  <br />
- `returns`: Encrypted data

Requires the `ENCRYPT` [permission](#permissions).

### `decrypt(data, options): Promise<string>`

Decrypt data with the user's wallet. This is an implementation of the [webcrypto decrypt API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt).

- `data`: `BufferSource` data to decrypt
- `algorithm`: Decrypt [algorithm](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt#parameters)
  <br />
- `returns`: Decrypted data

Requires the `DECRYPT` [permission](#permissions).

### ~~`signature(data, options): Promise<Uint8Array>`~~

> ⚠️ **Deprecation warning:** The `signature()` function is deprecated in Wander 1.0.0. Read about the alternatives below.

#### Alternatives

There are quite a few cases where you might need to generate a cryptographic signature for a piece of data or message so that you can verify them. The most common ones and their alternatives are the following:

- Generating a signature for a transaction: [`sign()`](#signtransaction-options-promisetransaction)
- Generating a signature for a bundle data item: [`signDataItem()`](#signdataitemdataitem) or [`dispatch()`](#dispatchtransaction-promisedispatchresult)
- Signing a message to later validate ownership: [`signMessage()`](#signmessagedata-options-promiseuint8array) combined with [`verifyMessage()`](#verifymessagedata-signature-promiseboolean)

~~Get the signature for a data array.~~

- ~~`data`: `Uint8Array` data to get the signature for~~
- ~~`options`: Signature options~~
  <br />
- ~~`returns`: Signature~~

~~Requires the `SIGNATURE` [permission](#permissions).~~

### `signDataItem(dataItem): Promise<RawDataItem>`

Generate a signed data item, than can later be submitted to an [ANS-104](https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md) compatible bundler

- dataItem: `DataItem` type object with the data to sign

The `DataItem` type should conform to:

```ts
export interface DataItem {
  data: string | Uint8Array;
  target?: string;
  anchor?: string;
  tags?: {
    name: string;
    value: string;
  }[];
}
```

### `signMessage(data, options): Promise<Uint8Array>`

Get a cryptographic signature for any piece of data for later validation

- `data`: `Uint8Array` data to get the signature for
- `options`: [`SignMessageOptions`](#options) Signature options
  <br />
- `returns`: `Uint8Array` Signed data

Requires the `SIGNATURE` [permission](#permissions).

#### Options

Wander allows you to customize the hash algorithm (`SHA-256` by default):

```ts
export interface SignMessageOptions {
  hashAlgorithm?: "SHA-256" | "SHA-384" | "SHA-512";
}
```

### `verifyMessage(data, signature): Promise<Boolean>`

Verify validity of a cryptographic signature for a given piece of data

- `data`: `ArrayBuffer` data to verify against the signature
- `signature`: `ArrayBuffer | string` Signature to validate
- `publicKey?`: `string` Arweave wallet `JWK.n` field, tx owner field or [public key from Wander](#getactivepublickey-promisestring)
- `options`: [`SignMessageOptions`](#options) Configuration for the signature
  <br />
- `returns`: `Boolean` Validity of the signature

Requires the `SIGNATURE` [permission](#permissions).

### `getPermissions(): Promise<PermissionType[]>`

Get the [permissions](#permissions) allowed for you site by the user.

- `returns`: A list of [permissions](#permissions) allowed for your dApp.

### `getArweaveConfig(): Promise<ArweaveConfig>`

Get the user's custom [Arweave config](#arweave-config) set in the extension

- `returns`: Custom [Arweave config](#arweave-config)

Requires the `ACCESS_ARWEAVE_CONFIG` [permission](#permissions).

### `addToken(id, type?, gateway?)`

Add a token to the user's wallet (Wander). The token will show up in Wander assets / collectibles.

> **Note:** You do not need to be connected in order to add a token

- `id`: ID of the token to add
- `type`: Optional token type (`asset` or `collectible`)
- `gateway`: Optional gateway to fetch the token from (see the [format](#arweave-config))

> **Warning:** If the gateway is defined, Wander will not use the default Warp Mainnet Gateway, but the custom one. This might slow down evaluation!

### `isTokenAdded(id)`

Check if a token has been added to the user's wallet (Wander).

- `id`: ID of the token to add
  <br />
- `returns`: Boolean value indicating if the token has been added or not.

## Permissions

There are 8 permissions currently available. When calling `connect`, you need to specify at least one of them, commonly `ACCESS_ADDRESS`.

The permissions:

- `ACCESS_ADDRESS`:
  Access the current address selected in Wander

- `ACCESS_PUBLIC_KEY`
  Access the public key of the current address selected in Wander

- `ACCESS_ALL_ADDRESSES`:
  Access all addresses added to Wander

- `SIGN_TRANSACTION`:
  Sign a transaction

- `DISPATCH`:
  Dispatch (sign and send) a transaction

- `ENCRYPT`:
  Encrypt data with the user's keyfile

- `DECRYPT`:
  Decrypt data with the user's keyfile

- `SIGNATURE`
  Sign data with the user's keyfile

- `ACCESS_ARWEAVE_CONFIG`:
  Access the user's custom Arweave config

## Arweave config

The user can set a custom Arweave config in the extension. It implements the following format:

```ts
{
  host: string;
  port: number;
  protocol: "http" | "https";
}
```

## Typescript types

To support Wander types, you can install the npm package `arconnect`, like this:

```sh
npm i -D arconnect
```

or

```sh
yarn add -D arconnect
```

To add the types to your project, you should either include the package in your `tsconfig.json`, or add the following to your `env.d.ts` file:

```ts
/// <reference types="arconnect" />
```

Type declarations can be found [here](../types/index.d.ts).

## Build project (Chrome, Brave)

You can find the build guide [here](./CONTRIBUTING.md#building-the-project).

## Contributing

Please read the [Contributing guide](./CONTRIBUTING.md).

## License

Licensed under the [MIT](./../LICENSE) license.
