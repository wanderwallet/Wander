# Wander Embedded SDK

[![npm version](https://img.shields.io/npm/v/@wanderapp/embed-sdk.svg)](https://www.npmjs.com/package/@wanderapp/embed-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight, customizable SDK for integrating Wander wallet functionality into your web applications.

## Features

- 🔌 **Easy Integration**: Simple API to embed Wander wallet functionality in any web app
- 🎨 **Customizable UI**: Extensive theming options for both light and dark modes
- 📱 **Responsive Design**: Adapts to different screen sizes with multiple layout options
- 🔒 **Secure**: Communication with Wander wallet happens in a secure iframe
- 🔔 **Event Callbacks**: Listen to authentication, balance changes, and transaction requests

## Installation

```bash
npm install @wanderapp/embed-sdk
```

or

```bash
yarn add @wanderapp/embed-sdk
```

## Basic Usage

### React

```javascript
import { useEffect, useState } from "react";
import { WanderEmbedded } from "@wanderapp/embed-sdk";

function WalletConnect() {
  const [instance, setInstance] = useState(null);

  useEffect(() => {
    // Initialize the wallet
    const wanderInstance = new WanderEmbedded({
      iframe: {
        routeLayout: {
          auth: "modal"
        }
      },
      button: {
        position: "bottom-right",
        theme: "light",
        label: true,
        wanderLogo: "default"
      }
    });

    setInstance(wanderInstance);

    // Clean up on unmount
    return () => {
      if (wanderInstance) {
        wanderInstance.destroy();
      }
    };
  }, []);

  return ...;
}

export default WalletConnect;
```

## Configuration Options

```javascript
const wander = new WanderEmbedded({
  // Button configuration
  button: {
    position: "bottom-right", // "bottom-right", "bottom-left", "top-right", "top-left", "static"
    theme: "system",
    wanderLogo: "default", // 'none', 'default', or 'text-color'
    label: true
  },

  // Iframe configuration
  iframe: {
    routeLayout: {
      auth: "popup" // "popup" | "modal" | "half" | "sidebar";
    }
  }
});
```

## Advanced Configuration

### Button Configuration

#### Custom Button Styling

```javascript
const wander = new WanderEmbedded({
  button: {
    position: "top-right",
    cssVars: {
      // Light theme variables
      light: {
        background: "#ffffff",
        color: "#000000",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
      },
      // Dark theme variables
      dark: {
        background: "#1a1a1a",
        color: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
      }
    }
  }
});
```

#### Custom CSS Styles

You can add custom CSS styles to the button using `customStyles` option. When using this option, you must use CSS selectors to target specific elements.

Available selectors:

- `:host` - Targets the button container
- `.button` - Targets the button element
- `.wanderLogo` - Targets the Wander logo SVG
- `.label` - Targets the button text label
- `.balance` - Targets the balance display
- `.indicator` - Targets the connection status indicator
- `.dappLogo` - Targets the dApp logo image
- `.notifications` - Targets the notifications badge

Example usage:

```javascript
const wander = new WanderEmbedded({
  button: {
    customStyles: `
      /* Position the button container */
      :host {
        position: fixed;
        top: 20px;
        right: 20px;
      }

      /* Target the button element */
      .button {
        width: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Target the Wander logo */
      .wanderLogo {
        width: 24px;
        height: 24px;
      }

      /* Target the button label */
      .label {
        font-size: 14px;
        font-weight: 500;
      }

      /* Target the balance display */
      .balance {
        font-size: 12px;
        opacity: 0.8;
      }

      /* Target the connection indicator */
      .indicator {
        width: 6px;
        height: 6px;
      }

      /* Target the dApp logo */
      .dappLogo {
        width: 18px;
        height: 18px;
      }

      /* Target the notifications badge */
      .notifications {
        font-size: 10px;
        padding: 2px 6px;
      }
    `
  }
});
```

The button element has several CSS classes that are added based on its state:

- `.isAuthenticated` - Added when the user is authenticated
- `.isConnected` - Added when the wallet is connected
- `.isOpen` - Added when the wallet interface is open

You can use these classes in your `customStyles` to style different states:

```javascript
customStyles: `
  .button.isAuthenticated {
    border-color: green;
  }

  .button.isConnected {
    background: rgba(0, 255, 0, 0.1);
  }

  .button.isOpen {
    transform: scale(0.95);
  }
`;
```

#### Custom Button Positioning

The button can be positioned in two ways:

1. Using predefined positions:

```javascript
const wander = new WanderEmbedded({
  button: {
    position: "bottom-right" // "bottom-right" | "bottom-left" | "top-right" | "top-left"
  }
});
```

1. Using custom positioning with `"static"`:

```javascript
const wander = new WanderEmbedded({
  button: {
    parent: document.getElementById("wanderButtonContainer"),
    position: "static",
    // Using customStyles (recommended for styling button internals)
    customStyles: `
      /* Position the button container */
      :host {
        position: fixed;
        top: 20px;
        right: 20px;
      }

      /* Optional: Style the button itself */
      .button {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
      }
    `
  }
});
```

Or using external CSS (useful for positioning the container):

```javascript
const wander = new WanderEmbedded({
  button: {
    position: "static",
    id: "my-wander-button" // Default is "wanderEmbeddedButtonHost"
  }
});
```

```css
/* Position the button container */
#my-wander-button {
  position: fixed;
  top: 20px;
  right: 20px;
}
```

### Iframe Configuration

#### Custom Modal Layouts

```javascript
const wander = new WanderEmbedded({
  iframe: {
    routeLayout: {
      // Different layouts for different routes
      default: {
        type: "popup",
        position: "bottom-right"
      },
      auth: {
        type: "modal"
      },
      "auth-request": {
        type: "sidebar",
        position: "right",
        expanded: true
      }
    },
    cssVars: {
      background: "#f5f5f5",
      borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)"
    }
  }
});
```

#### Custom CSS Styles

You can add custom CSS styles to the iframe using `customStyles` option. When using this option, you must use CSS selectors to target specific elements.

Available selectors:

- `.backdrop` - Targets the backdrop overlay behind the iframe
  - `.backdrop.show` - Applied when the backdrop is visible
- `.iframe-wrapper` - Targets the container that wraps the iframe
  - `.iframe-wrapper.show` - Applied when the iframe is visible
- `.iframe` - Targets the actual iframe element
- `.half-image` - Targets the image element used in half layout mode
  - `.half-image.show` - Applied when the half-image is visible

Example usage:

```javascript
const wander = new WanderEmbedded({
  iframe: {
    customStyles: `
      /* Style the backdrop */
      .backdrop {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        transition: opacity 200ms ease;
      }

      .backdrop.show {
        opacity: 1;
      }

      /* Style the iframe wrapper */
      .iframe-wrapper {
        border: none;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        transition: transform 200ms ease, opacity 200ms ease;
      }

      .iframe-wrapper.show {
        opacity: 1;
        transform: none;
      }

      /* Style the iframe itself */
      .iframe {
        border-radius: inherit;
        background: white;
      }

      /* Style the half-image */
      .half-image {
        object-fit: cover;
        transition: opacity 300ms ease;
      }

      .half-image.show {
        opacity: 1;
      }

      /* Mobile-specific styles */
      @media (max-width: 540px) {
        .backdrop {
          backdrop-filter: none;
        }

        .iframe-wrapper {
          border-radius: 0;
        }
      }
    `
  }
});
```

The iframe elements have several data attributes that you can use for conditional styling:

- `[data-layout="popup|modal|sidebar|half"]` - Current layout type
- `[data-position="left|right|top-left|top-right|bottom-left|bottom-right"]` - Position of the iframe
- `[data-expanded="true|false"]` - Whether the iframe is in expanded mode
- `[data-expand-on-mobile="true|false"]` - Whether the iframe expands on mobile devices

You can use these attributes in your `customStyles` to style different states:

```javascript
customStyles: `
  /* Style popup layout */
  .iframe-wrapper[data-layout="popup"] {
    transform: scale(0.95);
  }

  .iframe-wrapper[data-layout="popup"].show {
    transform: scale(1);
  }

  /* Style expanded sidebar */
  .iframe-wrapper[data-layout="sidebar"][data-expanded="true"] {
    border: none;
    border-radius: 0;
  }

  /* Style right-positioned half layout */
  .iframe-wrapper[data-layout="half"][data-position="right"] {
    border-left: 2px solid rgba(0, 0, 0, 0.1);
  }

  /* Style mobile expanded state */
  .iframe-wrapper[data-expand-on-mobile="true"] {
    width: 100vw;
    height: 100vh;
    border: none;
    border-radius: 0;
  }

  /* Combine attributes for specific cases */
  .iframe-wrapper[data-layout="sidebar"][data-position="right"][data-expanded="true"] {
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
  }
`;
```

## API Reference

### Methods

- `open()` - Opens the wallet interface
- `close()` - Closes the wallet interface
- `destroy()` - Removes all elements and event listeners

## Using with Arweave

The SDK automatically sets up `window.arweaveWallet` for compatibility with Arweave applications:

```javascript
// After initializing WanderEmbedded, you can use window.arweaveWallet
const wander = new WanderEmbedded();

// Example Arweave interaction
async function connectWallet() {
  try {
    await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"]);
    const address = await window.arweaveWallet.getActiveAddress();
    console.log("Connected to wallet address:", address);
  } catch (error) {
    console.error("Error connecting to wallet:", error);
  }
}
```

## Browser Support

The SDK supports all modern browsers (Chrome, Firefox, Safari, Edge).

## Development Setup

1. `yarn install`

   Install the project dependencies.

2. `yarn build:wallet-api`

   The TS/JS SDK imports some shared dependencies (`setupWalletSDK()`) from an already built
   version of the main repo.

   Until we have a monorepo, this command builds the bundle with this shared dependency under
   `wander-embedded-sdk/sdk-dist`.

3. `yarn dev:iframe`

   The Wander Embedded App should now be running at `http://localhost:5173`.

After this, you can use the Wander Embedded App in 2 different ways:

- As a standalone app, you can just access `http://localhost:5173` and start using it. Note,
  however, that this is not how developers will be using it, so you might find some differences
  when testing some features (e.g. when running inside an iframe, we must use unpartitioned state
  for some features, like authentication, to work properly).

- Embedded inside an iframe (**recommended**). In this case, you need a "test app" that install the
  Wander Embedded SDK to load the app inside an iframe. The section below explains different ways to
  do that.

<br />

### Using the Wander Embedded SDK

The minimum setup you must do to get Wander Embedded to work on a project looks like this:

```javascript
  import { WanderEmbedded } from "@wanderapp/embed-sdk";

  // ...

  useEffect(() => {
    async function initAndTestWander() {
      const wander = new WanderEmbedded({
        clientId: "ALPHA",
      });

      // After `new WanderEmbedded`, `window.arweaveWallet` is now the Wander Embedded API, rather
      than the Wander BE one.

      // Calling API methods will open/highlight the Wander Embedded iframe (popup/modal) if
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

You can play around with Wander Embedded at <https://playground.othent.io/>, which uses:

- The latest version of the playground itself: <https://playground.othent.io/>
- The latest version of the Wander Embedded app: <https://embed.wander.app/>
- The latest version of `@wanderapp/embed-sdk`: <https://www.npmjs.com/package/@wanderapp/embed-sdk>
- The latest version of the server & tRPC API: <https://embed-api.wander.app/>

Most likely you need that playground to load your local version of the app, SDK, and/or server. See
below the different options available.

<br />

#### Local Playground + Local App + Latest SDK + Local/Latest Server

**App:**

After running `yarn dev:iframe`, the Wander Embedded App should be running at
`http://localhost:5173`.

By default, the app will point its tRPC client to <http://localhost:3001> when running in development
mode, or to <https://embed-api.wander.app/> when running in production mode. See:

- `createTRPCClient` call in `src/utils/embedded/embedded.utils.ts` for the setup logic.
- `.env` / `.env.example` for the development values.
- Vercel's Environment variables, for the production values.

**Playground & SDK:**

Next, clone <https://github.com/Othent/KMS-test-repo/> and run `pnpm install && pnpm start`. The
playground should be running at `http://localhost:3000`, using the published version of
`@wanderapp/embed-sdk`.

By default, the published version of `@wanderapp/embed-sdk` will point to the latest version of the
Wander Embedded app, which in turn will point its tRPC client to the latest version of the server
(<https://embed-api.wander.app/>).

You now need to make the SDK load `http://localhost:5173`, which you can do using the `baseURL`
option. If you also need to connect to a server hosted elsewhere, you can use the `baseServerURL`
options:

```javascript
const wander = new WanderEmbedded({
  clientId: "ALPHA",
  baseURL: "http://localhost:5173",
  baseServerURL: "http://localhost:3001"
});
```

> [!TIP]
> You can get an actual clientId from the Wander Dashboard by creating a Team and an Application.

**Server:**

Go to the `embed-api` repo and run:

- `pnpm install`

- `pnpm dev` - The server & tRPC API will run at `http://localhost:3001` (if the Playground was
  already running on port `3000`).

- `pnpm sdk:dev` - Only if you want to use a local instance of `embed-api`:

  - If local, then the `package.json` a the root of this project should say:
    "embed-api": "link:../embed-api/",

  - If you want to use the currently published version of `embed-api`, then it should say:
    "embed-api": "<https://github.com/wanderwallet/embed-api#><SOME_HASH>",

<br />

#### Local Playground + Local App + Local SDK + Local/Latest Server

To use a local `@wanderapp/embed-sdk`, go to the playground repo and run `pnpm link-embed`, which
changes the `@wanderapp/embed-sdk` dependency to:

```json
  "@wanderapp/embed-sdk": "link:./../wander/Wander/wander-embedded-sdk/"`
```

You can revert this change running `pnpm link-embed`, which changes the `@wanderapp/embed-sdk`
dependency back to:

```json
  "@wanderapp/embed-sdk": "^0.0.1"`
```

Then, go into `wander-embedded-sdk` in this repo and run `pnpm install` and `pnpm dev`.

When running in development mode, the SDK will use `http://localhost:5173` as the default value for
`baseURL`, instead of `https://embed.wander.app/`. See
`wander-embedded-sdk/src/wander-embedded.ts`.

> [!WARNING]
> Temporarily, the <https://embed.wander.app/> URLs are actually <https://embed-dev.wander.app/>. This
> should be replaced before launch.

<br />
