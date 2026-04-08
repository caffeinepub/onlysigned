import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IssuerSubtype,
  ProfileType,
  UpdateProfileArgs,
} from "../backend-types";
import { useActor } from "./useActor";

/**
 * Fetch the current caller's profile.
 */
export function useMyProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await actor.getMyProfile();
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

/**
 * Save/update the caller's profile.
 * Uses the UpdateProfileArgs object as required by the backend.
 */
export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      displayName: string;
      bio: string;
      profileType: ProfileType;
      certIssuerSubtype?: IssuerSubtype;
      birthdate?: string;
      email?: string;
      profilePhoto?: string;
      personalUrl?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const args: UpdateProfileArgs = {
        displayName: params.displayName,
        bio: params.bio,
        profileType: params.profileType,
        certIssuerSubtype: params.certIssuerSubtype,
        birthdate: params.birthdate,
        email: params.email,
        profilePhoto: params.profilePhoto,
        personalUrl: params.personalUrl,
      };
      const result = await actor.updateMyProfile(args);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

/**
 * Register a new user — backend takes only displayName
 */
export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.registerUser(displayName);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

/**
 * Set the caller's username (requires owning a UsernameNFT)
 */
export function useSetUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.setUsername(username);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

/**
 * Returns true if the current user has admin status.
 * Based on profile.isAdmin — NOT userNumber comparison.
 */
export function useIsAdmin(): boolean {
  const { data: profile } = useMyProfile();
  return profile?.isAdmin === true;
}
