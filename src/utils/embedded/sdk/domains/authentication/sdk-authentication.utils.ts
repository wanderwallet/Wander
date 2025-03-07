// TODO: Please, add TS Docs. Not all interfaces here are needed.

import { setAuthorization } from "~utils/embedded/sdk/utils/axios-client/sdk-axios-client.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";

export interface AuthenticateParams {}

export interface AuthenticateReturn {}

export function authenticate() {
  // TODO: Authenticate...

  const authToken = "";
  const userDetails = {};

  setAuthorization(authToken);

  postEmbeddedMessage({
    type: "embedded_auth",
    data: {
      userDetails
    }
  });
}

export interface RefreshSessionParams {}

export interface RefreshSessionReturn {}

export function refreshSession() {
  // TODO: Refresh session...

  const authToken = "";
  const userDetails = {};

  setAuthorization(authToken);

  postEmbeddedMessage({
    type: "embedded_auth",
    data: {
      userDetails
    }
  });
}

export interface SignOutParams {}

export interface SignOutReturn {}

export function signOut() {
  // TODO: Sign out...

  setAuthorization(null);

  postEmbeddedMessage({
    type: "embedded_auth",
    data: {
      userDetails: null
    }
  });
}

export interface FakeAuthenticateParams {}

export interface FakeAuthenticateReturn {}

export function fakeAuthenticate() {
  // TODO: Fake authenticate...

  const authToken = "";
  const userDetails = {};

  setAuthorization(authToken);

  postEmbeddedMessage({
    type: "embedded_auth",
    data: {
      userDetails
    }
  });
}

export interface FakeRefreshSessionParams {}

export interface FakeRefreshSessionReturn {}

export function fakeRefreshSession() {
  // TODO: Fake refresh session...

  const authToken = "";
  const userDetails = {};

  setAuthorization(authToken);

  postEmbeddedMessage({
    type: "embedded_auth",
    data: {
      userDetails
    }
  });
}
