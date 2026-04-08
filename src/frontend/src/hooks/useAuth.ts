import { useInternetIdentity } from "./useInternetIdentity";

/**
 * Thin wrapper around useInternetIdentity that exposes a clean interface
 * with consistent naming used throughout the app.
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

  const isAuthenticated = !!identity;
  const principal = identity?.getPrincipal();

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

/** Returns true if user is authenticated */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
