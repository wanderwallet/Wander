import { useContext } from "react";
import { AuthRequestsContext } from "./auth.provider";
import { AuthRequestByType, AuthType } from "./auth.types";
import { ERR_MSG_USER_CANCELLED_AUTH } from "./auth.constants";

export function useAuthRequests() {
  return useContext(AuthRequestsContext);
}

/**
 * Get the current AuthRequest and validate it has the expected type.
 *
 * @param type Expected type of the AuthRequest.
 */
export function useCurrentAuthRequest<T extends AuthType>(expectedAuthType: T | "any") {
  const { authRequests, currentAuthRequestIndex, lastCompletedAuthRequest, completeAuthRequest, closeAuthPopup } =
    useContext(AuthRequestsContext);

  const authRequest = authRequests[currentAuthRequestIndex] as AuthRequestByType[T];
  const authRequestType = authRequest?.type;

  if (expectedAuthType !== "any") {
    if (!authRequest) {
      throw new Error(`Missing "${expectedAuthType}" AuthRequest.`);
    } else if (expectedAuthType !== authRequestType) {
      throw new Error(`Unexpected "${authRequestType}" AuthRequest. ${expectedAuthType} expected.`);
    }
  }

  const { type, authID, status } = authRequest || {};

  function acceptRequest(data?: any) {
    if (status !== "pending") throw new Error(`AuthRequest ${type}(${authID}) already ${status}`);

    return completeAuthRequest(authID, data);
  }

  function rejectRequest(errorMessage?: string) {
    if (status !== "pending") throw new Error(`AuthRequest ${type}(${authID}) already ${status}`);

    return completeAuthRequest(authID, new Error(errorMessage || ERR_MSG_USER_CANCELLED_AUTH));
  }

  return {
    authRequest,
    lastCompletedAuthRequest,
    acceptRequest,
    rejectRequest,
    closeAuthPopup,
  };
}
