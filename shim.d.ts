import type { ProtocolWithReturn } from "@arconnect/webext-bridge";
import type { DisplayTheme } from "@arconnect/components-rebrand";
import type { Chunk } from "~api/modules/sign/chunks";
import type { InjectedEvents } from "~utils/events";
import "styled-components";
import type {
  AuthRequestMessageData,
  AuthResult
} from "~utils/auth/auth.types";

declare module "@arconnect/webext-bridge" {
  export interface ProtocolMap {
    /**
     * `api/foreground/foreground-setup-wallet-sdk.ts` use `postMessage()` to send `arweaveWallet.*` calls that are
     * received in `contents/api.ts`, which then sends them to the background using `sendMessage()`.
     */
    api_call: ProtocolWithReturn<ApiCall, ApiResponse>;

    /**
     * `dispatch.foreground.ts` and `sign.foreground.ts` use `sendChunk()` to send chunks to the background.
     */
    chunk: ProtocolWithReturn<ApiCall<Chunk>, ApiResponse<number>>;

    /**
     * `createAuthPopup()` in `auth.utils.ts` sends `auth_request` messages from the background to the auth popup, which
     * are received in `auth.provider.ts`.
     */
    auth_request: AuthRequestMessageData;

    /**
     * `auth.hook.ts` uses `auth_result` messages (calling `replyToAuthRequest()`) to reply to the `AuthRequest`s.
     */
    auth_result: AuthResult<any>;

    /**
     * `signAuth()` in `sign_auth.ts` uses `auth_chunk` to send chunked transactions or binary data from the background
     * to the auth popup.
     */
    auth_chunk: Chunk;

    /**
     * The background sends `auth_tab_closed` messages to notify the auth popup of closed tabs.
     */
    auth_tab_closed: number;

    /**
     * The background sends `auth_tab_reloaded` messages to notify the auth popup of reloaded tabs.
     */
    auth_tab_reloaded: number;

    /**
     * The background sends `auth_active_wallet_change` messages to notify the auth popup of active wallet changes.
     */
    auth_active_wallet_change: number;

    /**
     * The background sends `auth_app_disconnected` messages to notify the auth popup of disconnected apps.
     */
    auth_app_disconnected: number;

    // EMBEDDED:

    embedded_auth: EmbeddedAuthMessageData;
    embedded_balance: EmbeddedBalanceMessageData;
    embedded_resize: EmbeddedResizeMessageData;
    embedded_close: void;

    // OTHER:

    switch_wallet_event: string | null;
    copy_address: string;
    event: Event;
    ar_protocol: ProtocolWithReturn<{ url: string }, { url: sting }>;
  }
}

interface ApiCall<DataType = any> extends JsonValue {
  app: "wander" | "wanderEmbedded";
  version: string;
  callID: number | string;
  type: string;
  data?: DataType;
}

interface ApiResponse<DataType = any> extends ApiCall<DataType> {
  error?: boolean;
}

interface Event {
  name: keyof InjectedEvents;
  value: unknown;
}

declare module "styled-components" {
  export interface DefaultTheme {
    displayTheme: DisplayTheme;
    theme: string;
    primaryText: string;
    secondaryText: string;
    tertiaryText: string;
    background: string;
    cardBorder: string;
    cardBackground: string;
    backgroundv2: string;
    primary: string;
    primaryBtnHover: string;
    secondaryBtnHover: string;
    secondaryItemHover: string;
    buttonDisabled: string;
    primaryTextv2: string;
    secondaryTextv2: string;
    buttonDisabledText: string;
    inputField: string;
    success: string;
    fail: string;
    backgroundSecondary: string;
    delete: string;
    secondaryDelete: string;
    button: {
      background: {
        primary: {
          default: string;
          hover: string;
          active: string;
          disabled: string;
        };
        secondary: {
          default: string;
          hover: string;
          active: string;
          disabled: string;
        };
        secondaryAlt: {
          default: string;
          hover: string;
          active: string;
          disabled: string;
        };
      };
      text: {
        primary: string;
        secondary: string;
        secondaryAlt: string;
        disabled: string;
      };
      hoverBorder: {
        primary: string;
        secondary: string;
        secondaryAlt: string;
      };
    };
    surfaceSecondary: string;
    surfaceTertiary: string;
    borderDefault: string;
    borderSecondary: string;
    input: {
      background: {
        search: { default: string; disabled: string; special: string };
        default: { default: string; disabled: string };
        dropdown: { default: string; disabled: string };
      };
      border: {
        default: { disabled: string; focused: string };
        search: { disabled: string; focused: string; special: string };
        dropdown: { default: string; disabled: string; focused: string };
      };
      placeholder: {
        default: string;
        search: string;
        dropdown: string;
      };
      icons: {
        searchActive: string;
        searchInactive: string;
      };
    };
    listItem: {
      hover: string;
      active: string;
      icon: string;
    };
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    BETA_VERSION?: string;
  }
}
