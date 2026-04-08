import { useInternetIdentity } from "./useInternetIdentity";

/** All known string forms of anonymous / invalid IC principals. */
const INVALID_PRINCIPAL_TEXTS = new Set(["2vxsx-fae", "aaaaa-aa"]);

/**
 * Thin wrapper around useInternetIdentity that exposes a clean interface
 * with consistent naming used throughout the app.
 *
 * isAuthenticated is true only when the identity exists AND the principal
 * is not one of the known anonymous / invalid forms. This prevents write
 * operations from firing with a still-anonymous actor during identity
 * transitions after login.
 */
export function useAuth() {
  const {
    identity,
    login,
    clear: logout,
    loginStatus,
    isInitializing,
    isLoggingIn,
  } = useInternetIdentity();

  const principal = identity?.getPrincipal();
  const principalText = principal?.toString() ?? "";
  // An identity object can exist while still being anonymous (e.g. the very
  // first frame after II resolves). Treat those as unauthenticated.
  const isAuthenticated =
    !!identity && !INVALID_PRINCIPAL_TEXTS.has(principalText);

  return {
    identity,
    principal,
    isAuthenticated,
    login,
    logout,
    isLoading: isInitializing || isLoggingIn,
    loginStatus,
  };
}

/** Returns the principal as a string, or empty string if not authenticated */
export function usePrincipalString(): string {
  const { principal } = useAuth();
  return principal?.toString() ?? "";
}

/** Returns true if user is authenticated with a real (non-anonymous) principal */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
