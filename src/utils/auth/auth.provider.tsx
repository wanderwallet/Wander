import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import {
  AUTH_POPUP_CLOSING_DELAY_MS,
  AUTH_POPUP_REQUEST_WAIT_MS,
  AUTH_POPUP_UNLOCK_REQUEST_TTL_MS,
  ERR_MSG_USER_CANCELLED_AUTH
} from "~utils/auth/auth.constants";
import type {
  AuthRequest,
  AuthRequestStatus,
  SignAuthRequest,
  SignKeystoneAuthRequest
} from "~utils/auth/auth.types";
import {
  compareConnectAuthRequests,
  replyToAuthRequest,
  stopKeepAlive
} from "~utils/auth/auth.utils";
import type { Chunk } from "~api/modules/sign/chunks";
import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import {
  bytesFromChunks,
  constructTransaction,
  type SplitTransaction
} from "~api/modules/sign/transaction_builder";
import { isomorphicOnMessage } from "~utils/messaging/messaging.utils";
import type { IBridgeMessage } from "@arconnect/webext-bridge";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { isError } from "~utils/error/error.utils";
import type {
  RouteOverride,
  RouteRedirect
} from "~wallets/router/router.types";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";

interface AuthRequestsContextState {
  authRequests: AuthRequest[];
  currentAuthRequestIndex: number;
  lastCompletedAuthRequest: null | AuthRequest;
}

interface AuthRequestsContextData extends AuthRequestsContextState {
  setCurrentAuthRequestIndex: (currentAuthRequestIndex: number) => void;
  completeAuthRequest: (authID: string, data: any) => Promise<void>;
}

const AUTH_REQUESTS_CONTEXT_INITIAL_STATE: AuthRequestsContextState = {
  authRequests: [],
  currentAuthRequestIndex: 0,
  lastCompletedAuthRequest: null
};

export const AuthRequestsContext = createContext<AuthRequestsContextData>({
  ...AUTH_REQUESTS_CONTEXT_INITIAL_STATE,
  setCurrentAuthRequestIndex: () => {},
  completeAuthRequest: async () => {}
});

interface AuthRequestProviderProps extends PropsWithChildren {
  useStatusOverride: () => RouteOverride | RouteRedirect;
}

export function AuthRequestsProvider({
  children,
  useStatusOverride
}: AuthRequestProviderProps) {
  const [
    { authRequests, currentAuthRequestIndex, lastCompletedAuthRequest },
    setAuthRequestContextState
  ] = useState<AuthRequestsContextState>(AUTH_REQUESTS_CONTEXT_INITIAL_STATE);

  const setCurrentAuthRequestIndex = useCallback(
    (currentAuthRequestIndex: number) => {
      setAuthRequestContextState((prevAuthRequestContextState) => {
        return {
          ...prevAuthRequestContextState,
          currentAuthRequestIndex
        };
      });
    },
    []
  );

  const closeAuthPopup = useCallback((delay: number = 0) => {
    function closeOrClear() {
      if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
        // TODO: This might cause an infinite loop in the embedded wallet:
        // setAuthRequestContextState(AUTH_REQUESTS_CONTEXT_INITIAL_STATE);

        // TODO: We could improve this to detect if we opened the wallet to show an AuthRequest, or if it was already
        // open. In the former case, when all AuthRequests are handled, we close it. In the latter, we just clear the
        // AuthRequests from the state but leave it open.

        postEmbeddedMessage({
          type: "embedded_request",
          data: {
            pendingRequests: 0
          }
        });

        postEmbeddedMessage({
          type: "embedded_close",
          data: null
        });
      } else {
        window.top.close();
      }
    }

    if (delay > 0) {
      const timeoutID = setTimeout(closeOrClear, delay);

      return () => clearTimeout(timeoutID);
    }

    closeOrClear();

    return () => {};
  }, []);

  const completeAuthRequest = useCallback(
    async (authID: string, data: any) => {
      const completedAuthRequest = authRequests.find(
        (authRequest) => authRequest.authID === authID
      );
      const completedAuthRequests = [completedAuthRequest];
      const completedAuthRequestType = completedAuthRequest.type;

      if (completedAuthRequestType === "connect") {
        // Find equivalent ConnectAuthRequest to also accept/reject those:

        authRequests.forEach((authRequest) => {
          if (
            authRequest.type === "connect" &&
            compareConnectAuthRequests(authRequest, completedAuthRequest)
          ) {
            completedAuthRequests.push(authRequest);
          }
        });
      }

      if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
        const pendingRequests =
          authRequests.filter((authRequest) => authRequest.status === "pending")
            .length - completedAuthRequests.length;

        postEmbeddedMessage({
          type: "embedded_request",
          data: {
            pendingRequests
          }
        });
      }

      // TODO: Consider automatically rejecting (expiring) AuthRequest if there are more than 100.

      const status: AuthRequestStatus = isError(data) ? "rejected" : "accepted";

      const authRequestRepliesPromises: Promise<AuthRequestStatus>[] =
        completedAuthRequests.map((completedAuthRequest) => {
          return replyToAuthRequest(
            completedAuthRequest.type,
            completedAuthRequest.authID,
            data
          )
            .then(() => {
              return status;
            })
            .catch((err) => {
              console.warn(`replyToAuthRequest(${authID}) failed:`, err);

              return "error";
            });
        });

      const completedAuthRequestsStatus = await Promise.all(
        authRequestRepliesPromises
      );

      log(
        LOG_GROUP.AUTH,
        `completeAuthRequest(authID = "${authID}", status = "${status}") => ${completedAuthRequestsStatus.join(
          ", "
        )}`
      );

      // If it is any other type of `AuthRequest`, we mark it as accepted/cancelled and move on to the next one:
      setAuthRequestContextState((prevAuthRequestContextState) => {
        const { authRequests, currentAuthRequestIndex } =
          prevAuthRequestContextState;

        if (authID !== authRequests[currentAuthRequestIndex]?.authID) {
          console.warn(
            `Mismatch between authID="${authID}" and AuthRequest[${currentAuthRequestIndex}]?.authID`
          );

          return prevAuthRequestContextState;
        }

        if (authID !== completedAuthRequests[0]?.authID) {
          console.warn(
            `Mismatch between authID="${authID}" and completedAuthRequests[0]?.authID`
          );

          return prevAuthRequestContextState;
        }

        const nextAuthRequests = authRequests;

        let nextLastCompletedAuthRequest: AuthRequest;

        completedAuthRequests.forEach((completedAuthRequest, i) => {
          const completedAuthRequestIndex = nextAuthRequests.findIndex(
            (authRequest) => authRequest.authID === completedAuthRequest.authID
          );

          if (completedAuthRequestIndex === -1) {
            console.warn(
              `Could not find AuthRequest with authID="${completedAuthRequestsStatus}"`
            );

            return;
          }

          nextAuthRequests[completedAuthRequestIndex] = {
            ...nextAuthRequests[completedAuthRequestIndex],
            completedAt: Date.now(),
            status: completedAuthRequestsStatus[i]
          };

          if (i === 0)
            nextLastCompletedAuthRequest =
              nextAuthRequests[completedAuthRequestIndex];
        });

        // Find the index of the next "pending" `AuthRequest`, or keep it unchanged if there are none left:
        let nextCurrentAuthRequestIndex = currentAuthRequestIndex;

        do {
          nextCurrentAuthRequestIndex =
            (nextCurrentAuthRequestIndex + 1) % nextAuthRequests.length;
        } while (
          nextCurrentAuthRequestIndex !== currentAuthRequestIndex &&
          nextAuthRequests[nextCurrentAuthRequestIndex].status !== "pending"
        );

        if (nextCurrentAuthRequestIndex === currentAuthRequestIndex) {
          nextCurrentAuthRequestIndex = nextAuthRequests.length;
        }

        return {
          authRequests: nextAuthRequests,
          currentAuthRequestIndex: nextCurrentAuthRequestIndex,
          lastCompletedAuthRequest: nextLastCompletedAuthRequest
        };
      });
    },
    [authRequests]
  );

  useEffect(() => {
    log(LOG_GROUP.AUTH, "Auth popup initialized. Waiting for AuthRequests");

    isomorphicOnMessage("auth_request", (authRequestMessage) => {
      log(LOG_GROUP.AUTH, "auth_request =", authRequestMessage);

      // UnlockAuthRequests are not enqueued as those are simply used to open the popup to prompt users to enter their
      // password and wait for the wallet to unlock:

      if (!authRequestMessage?.data) {
        console.warn("auth_request without data");
        return;
      }

      const authRequest = authRequestMessage.data;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        } = prevAuthRequestContextState;

        // TODO: Additional considerations when enqueueing new `AuthRequest`s:
        //
        // - `AuthRequest`s could be grouped by domain and/or tab. This means the auth popup could/should provide a
        //   domain/tab selector and automatically select the active tab when the user switches it.
        //
        // - Separate `signDataItem`requests could/should automatically be combined into a single `batchSignDataItem`
        //   (except maybe for the current `AuthRequest`, as otherwise the UI would constantly change as new requests
        //   are added to the batch).

        const nextAuthRequests = [
          ...authRequests,
          { ...authRequest, status: "pending" }
        ] satisfies AuthRequest[];

        if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
          const pendingRequests = nextAuthRequests.filter(
            (authRequest) => authRequest.status === "pending"
          ).length;

          postEmbeddedMessage({
            type: "embedded_request",
            data: {
              pendingRequests
            }
          });
        }

        // TODO: Add setting to decide whether we automatically jump to a new pending request when they arrive or stay
        // in the one currently selected.

        return {
          authRequests: nextAuthRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        };
      });
    });
  }, []);

  useEffect(() => {
    function handleTabReloadedOrClosed(message: IBridgeMessage<number>) {
      const tabID = message?.data;

      if (!tabID) return;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests: prevAuthRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        } = prevAuthRequestContextState;

        let pendingRequestsCount = 0;

        const authRequests = prevAuthRequests.map((authRequest) => {
          if (authRequest.tabID === tabID) {
            stopKeepAlive(authRequest.authID);

            return {
              ...authRequest,
              completedAt: Date.now(),
              status: "aborted"
            } satisfies AuthRequest;
          }

          if (authRequest.status === "pending") {
            ++pendingRequestsCount;
          }

          return authRequest;
        });

        if (pendingRequestsCount === 0 && authRequests.length > 0) {
          // All tabs that sent AuthRequest also got closed/reloaded/disconnected, so close the popup immediately:
          closeAuthPopup();
        }

        // TODO: Consider automatically selecting the next pending AuthRequest.

        return {
          authRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        };
      });
    }

    isomorphicOnMessage("auth_tab_reloaded", handleTabReloadedOrClosed);
    isomorphicOnMessage("auth_tab_closed", handleTabReloadedOrClosed);
    isomorphicOnMessage("auth_active_wallet_change", handleTabReloadedOrClosed);
    isomorphicOnMessage("auth_app_disconnected", handleTabReloadedOrClosed);
  }, [closeAuthPopup]);

  useEffect(() => {
    const chunksByCollectionID: Record<string, Chunk[]> = {};

    // Listen for chunks needed in `sign.tsx` and `signKeystone.tsx`:

    isomorphicOnMessage("auth_chunk", ({ sender, data }) => {
      if (sender.context !== "background") return;

      const { type, collectionID } = data;

      log(
        LOG_GROUP.CHUNKS,
        `auth_chunk(type ="${type}", collectionID = "${collectionID})"`
      );

      if (type === "start") {
        chunksByCollectionID[collectionID] = [];
      } else if (type === "end") {
        const arweave = new Arweave(defaultGateway);

        setAuthRequestContextState((prevAuthRequestContextState) => {
          const {
            authRequests: prevAuthRequests,
            currentAuthRequestIndex,
            lastCompletedAuthRequest
          } = prevAuthRequestContextState;

          const targetAuthRequest = prevAuthRequests.find((authRequest) => {
            return (
              (authRequest.type === "sign" ||
                authRequest.type === "signKeystone") &&
              authRequest.collectionID === collectionID
            );
          }) as SignAuthRequest | SignKeystoneAuthRequest;

          if (!targetAuthRequest) return prevAuthRequestContextState;

          // Update SignAuthRequest with `transaction`:

          if (targetAuthRequest.type === "sign") {
            const transaction = arweave.transactions.fromRaw(
              constructTransaction(
                targetAuthRequest.transaction as SplitTransaction,
                chunksByCollectionID[collectionID]
              )
            );

            const authRequests = prevAuthRequests.map((authRequest) => {
              if (authRequest.authID !== targetAuthRequest.authID)
                return authRequest;

              return {
                ...authRequest,
                transaction
              } as SignAuthRequest;
            });

            return {
              authRequests,
              currentAuthRequestIndex,
              lastCompletedAuthRequest
            };
          }

          // Update SignKeystoneAuthRequest with `data`:

          const bytes = bytesFromChunks(chunksByCollectionID[collectionID]);
          const data = Buffer.from(bytes);

          const authRequests = prevAuthRequests.map((authRequest) => {
            if (authRequest.authID !== targetAuthRequest.authID)
              return authRequest;

            return {
              ...authRequest,
              data
            } as SignKeystoneAuthRequest;
          });

          return {
            authRequests,
            currentAuthRequestIndex,
            lastCompletedAuthRequest
          };
        });
      } else {
        if (!chunksByCollectionID[collectionID]) {
          chunksByCollectionID[collectionID] = [data];
        } else {
          chunksByCollectionID[collectionID].push(data);
        }
      }
    });
  }, []);

  const statusOverride = useStatusOverride();

  useEffect(() => {
    let clearCloseAuthPopupTimeout = () => {};

    const isDone =
      authRequests.length > 0 &&
      authRequests.every((authRequest) => authRequest.status !== "pending");

    if (
      import.meta.env?.VITE_IS_EMBEDDED_APP !== "1" &&
      statusOverride === null &&
      authRequests.length === 0
    ) {
      // TODO: Maybe move to the app entry point?
      // Close the popup if an AuthRequest doesn't arrive in less than `AUTH_POPUP_REQUEST_WAIT_MS` (1s), unless the
      // wallet is locked (no timeout in that case):
      clearCloseAuthPopupTimeout = closeAuthPopup(AUTH_POPUP_REQUEST_WAIT_MS);
    } else if (statusOverride) {
      // If the user doesn't unlock the wallet in 15 minutes, or somehow the popup gets stuck into any other state for
      // more than that, we close it:
      clearCloseAuthPopupTimeout = closeAuthPopup(
        AUTH_POPUP_UNLOCK_REQUEST_TTL_MS
      );
    } else if (isDone) {
      // Close the window if the last request has been handled:

      // TODO: Add setting to decide whether this closes automatically or stays open in a "done" state.

      clearCloseAuthPopupTimeout = closeAuthPopup(AUTH_POPUP_CLOSING_DELAY_MS);
    }

    // Not needed in the embedded wallet, but can be left alone. It won't do anything:
    function handleBeforeUnload() {
      authRequests.forEach((authRequest) => {
        if (authRequest.status !== "pending") return;

        // Send cancel event for all pending requests if the popup is closed by the user:
        replyToAuthRequest(
          authRequest.type,
          authRequest.authID,
          new Error(ERR_MSG_USER_CANCELLED_AUTH)
        );
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearCloseAuthPopupTimeout();

      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [statusOverride, authRequests, currentAuthRequestIndex, closeAuthPopup]);

  return (
    <AuthRequestsContext.Provider
      value={{
        authRequests,
        currentAuthRequestIndex,
        lastCompletedAuthRequest,
        setCurrentAuthRequestIndex,
        completeAuthRequest
      }}
    >
      {children}
    </AuthRequestsContext.Provider>
  );
}
