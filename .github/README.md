# Wander

A non-custodial Arweave and AO native wallet with extensive features. Wander is available as a browser extension, mobile
application, and embedded smart account.

![Wander Banner](./wander-banner.png)

[![Wander Connect SDK NPM package license: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&color=%230077FF)](https://opensource.org/licenses/MIT)

Wander is an Arweave and AO native wallet that provides non-custodial wallet and asset management. Wander allows wallet
holders to interact with any Arweave or AO dApps without sharing the user needing to share private keys with the dApp.

> [!NOTE] Wander was formerly known as ArConnect.

<br />

## Docs

If you want to learn how to integrate Wander into your project, please take a look at our officials docs:

https://docs.wander.app

If you want to learn how to contribute or build the project locally, take a look at
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

<br />

## Typescript types

To support Wander types, you can install the npm package `arconnect`, like this:

```sh
npm i -D arconnect
```

or

```sh
yarn add -D arconnect
```

To add the types to your project, you should either include the package in your `tsconfig.json`, or add the following to
your `env.d.ts` file:

```ts
/// <reference types="arconnect" />
```

Type declarations can be found [here](../types/index.d.ts).
