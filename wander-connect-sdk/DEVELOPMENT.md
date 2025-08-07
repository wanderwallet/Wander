# Wander Connect Development Setup

This document describe the process for running one or more of the following applications/libraries for local
development:

- Wander Connect App: `./`
- Wander Connect SDK: `./wander-connect-sdk`
- [Wander Connect API](https://github.com/Wanderwallet/embed-api).
- [Arweave/AO Wallet Playground](KeyManagementService)

<br />

## Getting Started

1. `yarn install`

   Install the project dependencies.

2. `yarn build:wallet-api`

   The TS/JS SDK imports some shared dependencies (`injectWanderWalletAPI()`) from an already built version of the main
   repo.

   Until we have a monorepo, this command builds the bundle with this shared dependency under
   `wander-connect-sdk/sdk-dist`.

3. `yarn dev:iframe`

   The Wander Connect App should now be running at `http://localhost:5173`.

After this, you can use the Wander Connect App in 2 different ways:

- As a standalone app, you can just access `http://localhost:5173` and start using it. Note, however, that this is not
  how developers will be using it, so you might find some differences when testing some features (e.g. when running
  inside an iframe, we must use unpartitioned state for some features, like authentication, to work properly).

- Embedded inside an iframe (**recommended**). In this case, you need a "test app" that install the Wander Connect SDK
  to load the app inside an iframe. The section below explains different ways to do that.

<br />

## Using the Wander Connect SDK

The minimum setup you must do to get Wander Connect to work on a project looks like this:

```javascript
  import { WanderConnect } from "@wanderapp/connect";

  // ...

  useEffect(() => {
    async function initAndTestWander() {
      const wander = new WanderConnect({
        clientId: "FREE_TRIAL",
      });

      // After `new WanderConnect`, `window.arweaveWallet` is now the Wander Connect API, rather
      than the Wander BE one.

      // Calling API methods will open/highlight the Wander Connect iframe (popup/modal) if
      // authentication and/or authorization is needed:

      await window.arweaveWallet.connect(["SIGNATURE"]);

      const tx = ...;

      await window.arweaveWallet.sign(tx);

      // You can also manually open the popup/modal:
      wander.open();
    }

    initAndTestWander();
  }, []);
```

You can play around with Wander Connect at <https://playground.othent.io/>, which uses:

- The latest version of the playground itself: <https://playground.othent.io/>
- The latest version of the Wander Connect app: <https://connect.wander.app/>
- The latest version of `@wanderapp/connect`: <https://www.npmjs.com/package/@wanderapp/connect>
- The latest version of the server & tRPC API: <https://connect-api.wander.app/>

Most likely you need that playground to load your local version of the app, SDK, and/or server. See below the different
options available.

<br />

### Local Playground + Local App + Latest SDK + Local/Latest Server

**App:**

After running `yarn dev:iframe`, the Wander Connect App should be running at `http://localhost:5173`.

By default, the app will point its tRPC client to <http://localhost:3001> when running in development mode, or to
<https://connect-api.wander.app/> when running in production mode. See:

- `createTRPCClient` call in `src/utils/embedded/embedded.utils.ts` for the setup logic.
- `.env` / `.env.example` for the development values.
- Vercel's Environment variables, for the production values.

**Playground & SDK:**

Next, clone <https://github.com/Othent/KMS-test-repo/> and run `pnpm install && pnpm start`. The playground should be
running at `http://localhost:3000`, using the published version of `@wanderapp/connect`.

By default, the published version of `@wanderapp/connect` will point to the latest version of the Wander Connect app,
which in turn will point its tRPC client to the latest version of the server (<https://connect-api.wander.app/>).

You now need to make the SDK load `http://localhost:5173`, which you can do using the `baseURL` option. If you also need
to connect to a server hosted elsewhere, you can use the `baseServerURL` options:

```javascript
const wander = new WanderConnect({
  clientId: "FREE_TRIAL",
  baseURL: "http://localhost:5173",
  baseServerURL: "http://localhost:3001",
});
```

> [!TIP] You can get an actual clientId from the Wander Dashboard by creating a Team and an Application.

**Server:**

Go to the `embed-api` repo and run:

- `pnpm install`

- `pnpm dev` - The server & tRPC API will run at `http://localhost:3001` (if the Playground was already running on port
  `3000`).

- `pnpm sdk:dev` - Only if you want to use a local instance of `embed-api`:

  - If local, then the `package.json` a the root of this project should say: "embed-api": "link:../embed-api/",

  - If you want to use the currently published version of `embed-api`, then it should say: "embed-api":
    "<https://github.com/wanderwallet/embed-api#><SOME_HASH>",

<br />

### Local Playground + Local App + Local SDK + Local/Latest Server

To use a local `@wanderapp/connect`, go to the playground repo and run `pnpm link-embed`, which changes the
`@wanderapp/connect` dependency to:

```json
  "@wanderapp/connect": "link:./../wander/Wander/wander-connect-sdk/"`
```

You can revert this change running `pnpm link-embed`, which changes the `@wanderapp/connect` dependency back to:

```json
  "@wanderapp/connect": "^0.0.1"`
```

Then, go into `wander-connect-sdk` in this repo and run `pnpm install` and `pnpm dev`.

When running in development mode, the SDK will use `http://localhost:5173` as the default value for `baseURL`, instead
of `https://connect.wander.app/`. See `wander-connect-sdk/src/wander-connect.ts`.

<br />
