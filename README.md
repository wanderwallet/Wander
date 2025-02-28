# WanderEmbedded SDK Documentation

WanderEmbedded SDK provides a seamless way to integrate Wander functionality into your web application.

## Installation

```bash
npm install wander-embedded-sdk
# or
yarn add wander-embedded-sdk
```

## Quick Start

```javascript
import { WanderEmbedded } from "wander-embedded-sdk";

// Initialize with default options
const wander = new WanderEmbedded();

// Or initialize with custom options
const wander = new WanderEmbedded({
  buttonStyles: "custom",
  iframeStyles: {
    /* custom styles */
  },
  logo: "custom-logo-url"
});
```

## API Reference

### Constructor Options

The `WanderEmbedded` constructor accepts an optional configuration object with the following properties:

| **Option**     | **Type**                     | **Default** | **Description**                                                                                                     |
| -------------- | ---------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `buttonStyles` | object \| 'none'             | `undefined` | Customize the button’s appearance: - **object**: inline style object ; **'none'**: hide the button                  |
| `iframeRef`    | `HTMLIFrameElement`          | `undefined` | Use an existing iframe element instead of creating a new one.                                                       |
| `iframeStyles` | `object`                     | `undefined` | Inline styles for the iframe (e.g., `{ border: 'none', borderRadius: '12px' }`).                                    |
| `logo`         | `string`                     | `undefined` | URL for a custom logo displayed on the Wander button.                                                               |
| `balance`      | `string`                     | `undefined` | Show balance information on the button.                                                                             |
| `onOpen`       | `() => void`                 | `undefined` | Callback fired when the Wander iframe is opened.                                                                    |
| `onClose`      | `() => void`                 | `undefined` | Callback fired when the Wander iframe is closed.                                                                    |
| `onResize`     | `(data: ResizeData) => void` | `undefined` | Callback fired when the Wander iframe is resized. The `data` object typically includes new width and height values. |

### Methods

#### `open()`

Opens the Wander iframe.

```javascript
wander.open();
```

#### `close()`

Closes the Wander iframe.

```javascript
wander.close();
```

#### `destroy()`

Removes all Wander elements from the DOM and cleans up resources.

```javascript
wander.destroy();
```

## Examples

### Basic Integration

```javascript
const wander = new WanderEmbedded();
```

### Custom Styling

```javascript
const wander = new WanderEmbedded({
  buttonStyles: {
    backgroundColor: "#000000",
    color: "#ffffff"
    // Add more custom styles
  },
  iframeStyles: {
    border: "none",
    borderRadius: "12px"
    // Add more custom styles
  }
});
```

### With Event Handlers

```javascript
const wander = new WanderEmbedded({
  onOpen: () => {
    console.log("Wander iframe opened");
  },
  onClose: () => {
    console.log("Wander iframe closed");
  },
  onResize: (data) => {
    console.log("Iframe resized:", data);
  }
});
```

### Using Custom iframe

```javascript
const customIframe = document.getElementById("my-iframe");
const wander = new WanderEmbedded({
  iframeRef: customIframe
});
```

### Button-less Integration

```javascript
const wander = new WanderEmbedded({
  buttonStyles: "none"
});
```

## Notes

- The SDK automatically injects necessary elements into your webpage unless custom references are provided.
- Make sure to call `destroy()` when cleaning up to prevent memory leaks.
