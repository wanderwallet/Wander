# Wander Embedded SDK

## Dev Setup

**In the `embed-api` repo:**

- `pnpm install`
- `pnpm dev`
- `pnpm sdk:dev`

**At the root of this repo:**

- `yarn install`
- `yarn build:wallet-api` - The SDK imports some shared dependencies (`setupWalletSDK()`) from an already built version of the main repo.
- `yarn dev:iframe` - Wander Embedded should now be running at `http://localhost:5173`

**`cd wander-embedded-sdk/`**

- `yarn install`
- `yarn dev` - This builds of the SDK itself.

**Clone [kranthicodes/WE-SDK](https://github.com/kranthicodes/WE-SDK)**

- Update `App.tsx` with:

```
  const [message, setMessage] = useState("");
  const [instance, setInstance] = useState<WanderEmbedded | null>(null);

  useEffect(() => {
    const wanderInstance = new WanderEmbedded({
      applicationId: "<applicationId>",
      clientId: "<clientId>",
      iframe: {
        routeLayout: {
          auth: "modal",
          default: "popup",
        },
      },
      button: true,
    });

    wanderInstance.open();

    setInstance(wanderInstance);
  }, []);

  const handleSignMessage = async () => {
    await (window.arweaveWallet as any)?.connect(["SIGNATURE"]);
    await (window.arweaveWallet as any)?.signMessage(new TextEncoder().encode(message));
  };
```

- Get the applicationId and clientId from the Wander Dashboard by creating a team and an application.
- Replace `wander-embedded-sdk` in `package.json` with: `"wander-embedded-sdk": "link:./../wander/Wander/wander-embedded-sdk/"`
- `pnpm install`
- `pnpm dev`
