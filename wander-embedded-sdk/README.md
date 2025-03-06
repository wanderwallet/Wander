# Wander Embedded SDK

[![npm version](https://img.shields.io/npm/v/wander-embedded-sdk.svg)](https://www.npmjs.com/package/@wanderapp/embed-sdk)
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
    position: "bottom-right", // "bottom-right", "bottom-left", "top-right", "top-left"
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

### Custom Button Styling

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

### Custom Modal Layouts

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
