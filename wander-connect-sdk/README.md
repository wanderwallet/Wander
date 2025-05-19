# Wander Connect SDK

[![npm version](https://img.shields.io/npm/v/@wanderapp/connect.svg)](https://www.npmjs.com/package/@wanderapp/connect)
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
npm install @wanderapp/connect
```

or

```bash
yarn add @wanderapp/connect
```

## Basic Usage

### React

```javascript
import { useEffect, useState } from "react";
import { WanderConnect } from "@wanderapp/connect";

export function MyApp() {
  const [instance, setInstance] = useState(null);

  useEffect(() => {
    // Initialize the wallet
    const wanderInstance = new WanderConnect({
      clientId: "<CLIENT_ID>",
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
```

## Configuration Options

```javascript
const wander = new WanderConnect({
  // Button configuration
  button: {
    position: "bottom-right", // "bottom-right", "bottom-left", "top-right", "top-left", "static"
    theme: "system",
    wanderLogo: "default", // 'none', 'default', or 'text-color'
    label: true,
  },

  // Iframe configuration
  iframe: {
    routeLayout: {
      auth: "popup", // "popup" | "modal" | "half" | "sidebar";
    },
  },
});
```

## Advanced Configuration

### Button Configuration

#### Custom Button Styling

```javascript
const wander = new WanderConnect({
  button: {
    position: "top-right",
    cssVars: {
      // Light theme variables
      light: {
        background: "#ffffff",
        color: "#000000",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
      // Dark theme variables
      dark: {
        background: "#1a1a1a",
        color: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      },
    },
  },
});
```

#### Custom CSS Styles

You can add custom CSS styles to the button using `customStyles` option. When using this option, you must use CSS
selectors to target specific elements.

Available selectors:

- `:host` - Targets the button container
- `.button` - Targets the button element
- `.wanderLogo` - Targets the Wander logo SVG
- `.label` - Targets the button text label
- `.balance` - Targets the balance display
- `.indicator` - Targets the connection status indicator
- `.notifications` - Targets the notifications badge

Example usage:

```javascript
const wander = new WanderConnect({
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

      /* Target the notifications badge */
      .notifications {
        font-size: 10px;
        padding: 2px 6px;
      }
    `,
  },
});
```

The button element has a `data-variant` HTML attribute you can use for styling:

- `[data-variant="loading|onboarding|authenticated|not-authenticated"]`

As well as some CSS classes that are added based on its state:

- `.isConnected` - Added when the wallet is connected
- `.isOpen` - Added when the wallet interface is open

Additionally, the button's `.label` and `.balance` elements also have some modifiers:

- `.label.isLoading`
- `.balance.isLoading`
- `.balance.isHidden`

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

There are two approaches to positioning the Wander button:

##### 1. Using Predefined Positions

```javascript
const wander = new WanderConnect({
  button: {
    position: "bottom-right", // Options: "bottom-right", "bottom-left", "top-right", "top-left"
  },
});
```

##### 2. Using Custom Positioning with "static"

You have three methods for custom positioning:

###### 2.1. Using a Parent Element

First, create a container element:

```html
<div id="wanderButtonContainer"></div>
```

Then reference it in your configuration:

```javascript
const wander = new WanderConnect({
  button: {
    position: "static",
    parent: document.getElementById("wanderButtonContainer"),
  },
});
```

###### 2.2. Using Custom Styles

```javascript
const wander = new WanderConnect({
  button: {
    position: "static",
    // Using customStyles for precise control over button appearance and position
    customStyles: `
      /* Position the button container */
      :host {
        position: fixed;
        top: 20px;
        right: 20px;
      }

      /* Style the button itself */
      .button {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
      }
    `,
  },
});
```

###### 2.3. Using External CSS

Define the button with a custom ID:

```javascript
const wander = new WanderConnect({
  button: {
    position: "static",
    id: "my-wander-button", // Default is "wanderEmbeddedButtonHost"
  },
});
```

Then style it with external CSS:

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
const wander = new WanderConnect({
  iframe: {
    routeLayout: {
      // Different layouts for different routes
      default: {
        type: "popup",
        position: "bottom-right",
      },
      auth: {
        type: "modal",
      },
      "auth-request": {
        type: "sidebar",
        position: "right",
        expanded: true,
      },
    },
    cssVars: {
      background: "#f5f5f5",
      borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    },
  },
});
```

#### Custom CSS Styles

You can add custom CSS styles to the iframe using `customStyles` option. When using this option, you must use CSS
selectors to target specific elements.

Available selectors:

- `.backdrop` - Targets the backdrop overlay behind the iframe
  - `.backdrop.show` - Applied when the backdrop is visible
- `.iframe-wrapper` - Targets the container that wraps the iframe
  - `.iframe-wrapper.show` - Applied when the iframe is visible
- `.iframe` - Targets the actual iframe element
- `.half-image` - Targets the image element used in half layout mode
  - `.half-image.show` - Applied when the half-image is visible

The HTML structure is follows:

```html
<div class="wrapper">
  <iframe class="iframe"></iframe>
</div>
<div class="backdrop"></div>
<div class="half-image"></div>
```

Example usage:

```javascript
const wander = new WanderConnect({
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
    `,
  },
});
```

The iframe wrapper element (`.iframe-wrapper`) has several data attributes that you can use for conditional styling:

- `[data-layout="popup|modal|sidebar|half"]` - Current layout type
- `[data-position="left|right|top-left|top-right|bottom-left|bottom-right"]` - Position of the iframe
- `[data-expanded="true|false"]` - Whether the iframe is in expanded mode
- `[data-expand-on-mobile="true|false"]` - Whether the iframe expands on mobile devices

You can also use these when targeting the iframe element (`.iframe`):

```css
.iframe-wrapper[data-layout="popup"] > .iframe {
  ...;
}
```

Or the backdrop element (`.backdrop`):

```css
.iframe-wrapper[data-layout="popup"] + .backdrop {
  ...;
}
```

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
// After initializing WanderConnect, you can use window.arweaveWallet
const wander = new WanderConnect();

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

### Using the Wander Connect SDK

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

#### Local Playground + Local App + Latest SDK + Local/Latest Server

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

#### Local Playground + Local App + Local SDK + Local/Latest Server

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
