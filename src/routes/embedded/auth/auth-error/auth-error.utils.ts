const errorMap: Record<string, string> = {
  server_error:
    "There was a problem connecting to the authentication service. This could be due to network issues or server maintenance.",
  invalid_request:
    "The authentication request was invalid. This might happen if the session expired or required information was missing.",
  access_denied:
    "Access was denied. This usually happens if you declined permissions or the authentication was cancelled.",
  unauthorized_client:
    "This application is not authorized to perform this operation. Please contact support if this persists.",
  invalid_grant: "The authentication credentials were invalid or expired. Please try again with valid credentials.",
  invalid_scope:
    "The requested permissions were invalid or insufficient. Please try again and ensure all required permissions are granted.",
  temporarily_unavailable: "The authentication service is temporarily unavailable. Please try again in a few moments.",
  unknown_error:
    "An unexpected error occurred during authentication. Please try again or contact support if the issue persists.",
  unexpected_failure: "We could not get your email. Please, try a different authentication method.",
  // unexpected_failure description = Error+getting+user+email+from+external+provider
};

export function getFriendlyErrorMessage(error: string, description: string): string {
  // First check if it's a database error from the description
  if (description.includes("Database error")) {
    return "We're experiencing database connectivity issues. Please try again in a few moments.";
  }

  // Check for specific error codes in description (e.g., "500: Database error")
  const errorCode = description.split(":")[0];

  if (errorCode === "500") {
    return "Our authentication service is temporarily unavailable. Please try again later.";
  }

  return errorMap[error] || errorMap.unknown_error;
}
