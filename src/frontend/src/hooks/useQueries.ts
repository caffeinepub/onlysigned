/**
 * Comprehensive backend query and mutation hooks for OnlySigned.
 * All backend methods are called via the typed actor from useActor().
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuditLogEntry,
  CoSignInvitation,
  Collection,
  ContactInvitation,
  DailyMetrics,
  DownloadManifest,
  FileRef,
  IssuerSubtype,
  ItemType,
  ListingFilter,
  MarketplaceListing,
  Message,
  SaleMethod,
  SearchFilter,
  SignedCopy,
  SupportSubmission,
  Transaction,
  UpdateProfileArgs,
  User,
  UsernameNFT,
  UsernameOffer,
  WalletBalance,
} from "../backend-types";
import { useActor } from "./useActor";

// ─── User / Profile ──────────────────────────────────────────────────────────

export function useUserProfile(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<User | null>({
    queryKey: ["profile", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getUserProfile(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 3 * 60 * 1000,
  });
}

export function usePublicProfile(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<User | null>({
    queryKey: ["publicProfile", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getPublicProfile(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 3 * 60 * 1000,
  });
}

export function useLatestUsers(limit: bigint = BigInt(20)) {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["users", "latest", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLatestActiveUsers(limit);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

export function useSearchUsers(filter: SearchFilter | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["users", "search", filter],
    queryFn: async () => {
      if (!actor || !filter) return [];
      return actor.searchUsers(filter);
    },
    enabled: !!actor && !isFetching && !!filter,
    staleTime: 30 * 1000,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["users", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

export function useUserByNumber(n: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<User | null>({
    queryKey: ["user", "byNumber", n?.toString()],
    queryFn: async () => {
      if (!actor || n === undefined) return null;
      return actor.getUserByNumber(n);
    },
    enabled: !!actor && !isFetching && n !== undefined,
  });
}

export function useCheckIsFollowing(target: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isFollowing", target],
    queryFn: async () => {
      if (!actor || !target) return false;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.checkIsFollowing(Principal.fromText(target));
    },
    enabled: !!actor && !isFetching && !!target,
  });
}

export function useFollowers(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["followers", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.getFollowers(Principal.fromText(principal));
      return result.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useFollowing(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["following", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.getFollowing(Principal.fromText(principal));
      return result.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// ─── Collections ─────────────────────────────────────────────────────────────

export function useMyCollections() {
  const { actor, isFetching } = useActor();
  return useQuery<Collection[]>({
    queryKey: ["collections", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyCollections();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCollection(id: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Collection | null>({
    queryKey: ["collection", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      // No direct getCollection(id) endpoint — fetch all and filter
      const all = await actor.getMyCollections();
      return all.find((c) => c.id === id) ?? null;
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function usePublicCollections(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Collection[]>({
    queryKey: ["publicCollections", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getPublicCollections(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export function useMyAssets() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["assets", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyAssets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAsset(id: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getAsset(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function usePublicAssets(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["publicAssets", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getPublicAssets(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useSharedAssetsWithMe() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sharedAssets", "withMe"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSharedAssetsWithMe();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSignedCopiesForAsset(assetId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<SignedCopy[]>({
    queryKey: ["signedCopies", "forAsset", assetId],
    queryFn: async () => {
      if (!actor || !assetId) return [];
      return actor.getSignedCopiesForAsset(assetId);
    },
    enabled: !!actor && !isFetching && !!assetId,
  });
}

// ─── Signed Copies ───────────────────────────────────────────────────────────

export function useMySignedCopies() {
  const { actor, isFetching } = useActor();
  return useQuery<SignedCopy[]>({
    queryKey: ["signedCopies", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMySignedCopies();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSignedCopy(id: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<SignedCopy | null>({
    queryKey: ["signedCopy", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getSignedCopy(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useSignedCopyByUrl(url: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<SignedCopy | null>({
    queryKey: ["signedCopyByUrl", url],
    queryFn: async () => {
      if (!actor || !url) return null;
      return actor.getSignedCopyByUrl(url);
    },
    enabled: !!actor && !isFetching && !!url,
  });
}

export function useValidateCertificate(certId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<SignedCopy | null>({
    queryKey: ["certificate", certId],
    queryFn: async () => {
      if (!actor || !certId) return null;
      return actor.validateCertificate(certId);
    },
    enabled: !!actor && !isFetching && !!certId,
  });
}

export function usePublicSignedCopies(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<SignedCopy[]>({
    queryKey: ["publicSignedCopies", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getPublicSignedCopies(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useMyCoSignInvitations() {
  const { actor, isFetching } = useActor();
  return useQuery<CoSignInvitation[]>({
    queryKey: ["coSignInvitations", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyCoSignInvitations();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Marketplace ─────────────────────────────────────────────────────────────

export function useMarketplaceListings(filter: ListingFilter | null = null) {
  const { actor, isFetching } = useActor();
  return useQuery<MarketplaceListing[]>({
    queryKey: ["listings", filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListings(filter);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useListing(id: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<MarketplaceListing | null>({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getListing(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function usePublicMarketplaceListings() {
  const { actor, isFetching } = useActor();
  return useQuery<MarketplaceListing[]>({
    queryKey: ["listings", "public"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicMarketplaceListings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export function useMyWallet() {
  const { actor, isFetching } = useActor();
  return useQuery<WalletBalance | null>({
    queryKey: ["wallet", "mine"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyWallet();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

export function useMyTransactions(
  offset: bigint = BigInt(0),
  limit: bigint = BigInt(50),
) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions", "mine", offset.toString(), limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTransactions(offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Contacts / Chat ─────────────────────────────────────────────────────────

export function useMyContacts() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["contacts", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getMyContacts();
      return result.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePendingInvitations() {
  const { actor, isFetching } = useActor();
  return useQuery<ContactInvitation[]>({
    queryKey: ["invitations", "pending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingInvitations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMessages(contactPrincipal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", contactPrincipal],
    queryFn: async () => {
      if (!actor || !contactPrincipal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getMessages(Principal.fromText(contactPrincipal));
    },
    enabled: !!actor && !isFetching && !!contactPrincipal,
    staleTime: 15 * 1000,
  });
}

// ─── Username NFTs ────────────────────────────────────────────────────────────

export function useUsernameNFT(username: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<UsernameNFT | null>({
    queryKey: ["usernameNFT", username],
    queryFn: async () => {
      if (!actor || !username) return null;
      return actor.getUsernameNFT(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useAllUsernameNFTs() {
  const { actor, isFetching } = useActor();
  return useQuery<UsernameNFT[]>({
    queryKey: ["usernameNFTs", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsernameNFTs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyUsernameOffers() {
  const { actor, isFetching } = useActor();
  return useQuery<UsernameOffer[]>({
    queryKey: ["usernameOffers", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyUsernameOffers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsernameOffers() {
  const { actor, isFetching } = useActor();
  return useQuery<UsernameOffer[]>({
    queryKey: ["usernameOffers", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsernameOffers();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAdminStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

export function useAllSupportSubmissions() {
  const { actor, isFetching } = useActor();
  return useQuery<SupportSubmission[]>({
    queryKey: ["supportSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSupportSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<AuditLogEntry[]>({
    queryKey: ["auditLog"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDailyMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<DailyMetrics | null>({
    queryKey: ["dailyMetrics"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyMetrics();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllDailyMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<DailyMetrics[]>({
    queryKey: ["dailyMetrics", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDailyMetrics();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCanisterId() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["canisterId"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCanisterId();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCyclesBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint | null>({
    queryKey: ["cyclesBalance"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCyclesBalance();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateMyProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: UpdateProfileArgs) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.updateMyProfile(args);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.followUser(Principal.fromText(principal));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_data, principal) => {
      qc.invalidateQueries({ queryKey: ["followers"] });
      qc.invalidateQueries({ queryKey: ["isFollowing", principal] });
      qc.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.unfollowUser(Principal.fromText(principal));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_data, principal) => {
      qc.invalidateQueries({ queryKey: ["followers"] });
      qc.invalidateQueries({ queryKey: ["isFollowing", principal] });
      qc.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useCreateCollection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createCollection(
        data.name,
        data.description ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["collections", "mine"] }),
  });
}

export function useUpdateCollection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      description?: string;
      privacyPublic: boolean;
      forSale: boolean;
      salePrice: bigint;
      saleCurrency: string;
      saleMethod: SaleMethod;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.updateCollection(
        params.id,
        params.name,
        params.description ?? null,
        params.privacyPublic,
        params.forSale,
        params.salePrice,
        params.saleCurrency,
        params.saleMethod,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useDeleteCollection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.deleteCollection(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["collections", "mine"] }),
  });
}

export function useCreateAsset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      basePrice: bigint;
      royaltyBps: bigint;
      collectionId?: string;
      fileRefs: FileRef[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createAsset(
        data.name,
        data.description ?? null,
        data.basePrice,
        data.royaltyBps,
        data.collectionId ?? null,
        data.fileRefs,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets", "mine"] }),
  });
}

export function useUpdateAsset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description?: string;
      basePrice: bigint;
      royaltyBps: bigint;
      collectionId?: string;
      privacyPublic: boolean;
      fileRefs: FileRef[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.updateAsset(
        data.id,
        data.name,
        data.description ?? null,
        data.basePrice,
        data.royaltyBps,
        data.collectionId ?? null,
        data.privacyPublic,
        data.fileRefs,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useDeleteAsset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.deleteAsset(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets", "mine"] }),
  });
}

export function useSignAsset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      assetId: string;
      price: bigint;
      currency: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.signAsset(
        params.assetId,
        params.price,
        params.currency,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signedCopies"] }),
  });
}

export function useSetSignedCopyPrivacy() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; privacyPublic: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.setSignedCopyPrivacy(
        params.id,
        params.privacyPublic,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signedCopies"] }),
  });
}

export function useGenerateDownloadPackage() {
  const { actor } = useActor();
  return useMutation<DownloadManifest, Error, string>({
    mutationFn: async (signedCopyId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.generateDownloadPackage(signedCopyId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
  });
}

export function useListForSale() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      itemType: ItemType;
      itemId: string;
      price: bigint;
      currency: string;
      saleMethod: SaleMethod;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.listForSale(
        params.itemType,
        params.itemId,
        params.price,
        params.currency,
        params.saleMethod,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

export function useDelistItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.delistItem(listingId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

export function usePurchaseItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.purchaseItem(listingId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["wallet", "mine"] });
      qc.invalidateQueries({ queryKey: ["signedCopies", "mine"] });
    },
  });
}

export function usePlaceBid() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { listingId: string; amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.placeBid(params.listingId, params.amount);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

export function useDepositFunds() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { currency: string; amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.depositFunds(params.currency, params.amount);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet", "mine"] }),
  });
}

export function useWithdrawFunds() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      currency: string;
      amount: bigint;
      destinationAddress?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.withdrawFunds(
        params.currency,
        params.amount,
        params.destinationAddress ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });
}

export function useSendContactInvitation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.sendContactInvitation(
        Principal.fromText(principal),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}

export function useAcceptContactInvitation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.acceptContactInvitation(invitationId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts", "mine"] });
      qc.invalidateQueries({ queryKey: ["invitations", "pending"] });
    },
  });
}

// Alias for backward compatibility
export const useAcceptContact = useAcceptContactInvitation;

export function useDeclineContactInvitation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.declineContactInvitation(invitationId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["invitations", "pending"] }),
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { to: string; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.sendMessage(
        Principal.fromText(params.to),
        params.content,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["messages", vars.to] }),
  });
}

export function useMarkMessageRead() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.markMessageRead(messageId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
  });
}

export function useSubmitUsernameOffer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      username: string;
      amount: bigint;
      currency: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.submitUsernameOffer(
        params.username,
        params.amount,
        params.currency,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["usernameOffers", "mine"] }),
  });
}

export function useMintUsernameNFT() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { username: string; principal: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.mintUsernameNFT(
        params.username,
        Principal.fromText(params.principal),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usernameNFTs"] }),
  });
}

export function useTransferUsernameNFT() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { username: string; toPrincipal: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.transferUsernameNFT(
        params.username,
        Principal.fromText(params.toPrincipal),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usernameNFTs"] }),
  });
}

export function useAcceptUsernameOffer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.acceptUsernameOffer(offerId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usernameOffers"] });
      qc.invalidateQueries({ queryKey: ["usernameNFTs"] });
    },
  });
}

export function useRejectUsernameOffer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.rejectUsernameOffer(offerId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usernameOffers"] }),
  });
}

export function useInviteCoSigner() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      signedCopyId: string;
      inviteePrincipal: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.inviteCoSigner(
        params.signedCopyId,
        Principal.fromText(params.inviteePrincipal),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coSignInvitations"] }),
  });
}

export function useAcceptCoSign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.acceptCoSignInvitation(invitationId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signedCopies"] });
      qc.invalidateQueries({ queryKey: ["coSignInvitations"] });
    },
  });
}

export function useDeclineCoSign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.declineCoSignInvitation(invitationId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coSignInvitations"] }),
  });
}

export function useShareAsset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      assetId: string;
      contactPrincipal: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.shareAssetWithContact(
        params.assetId,
        Principal.fromText(params.contactPrincipal),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useRevokeAssetShare() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { assetId: string; withPrincipal: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.revokeAssetShare(
        params.assetId,
        Principal.fromText(params.withPrincipal),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useReclaimAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.reclaimAdmin();
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useSetUserAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { target: string; adminValue: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.setUserAdmin(
        Principal.fromText(params.target),
        params.adminValue,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useSetCertificateIssuerStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      target: string;
      isIssuer: boolean;
      subtype?: IssuerSubtype;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.setCertificateIssuerStatus(
        Principal.fromText(params.target),
        params.isIssuer,
        params.subtype ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useSubmitSupportForm() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      subject: string;
      message: string;
      email?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.submitSupportForm(
        params.subject,
        params.message,
        params.email ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
  });
}

export function useSetCollectionForSale() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      forSale: boolean;
      salePrice: bigint;
      saleCurrency: string;
      saleMethod: SaleMethod;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.setCollectionForSale(
        params.id,
        params.forSale,
        params.salePrice,
        params.saleCurrency,
        params.saleMethod,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

// ─── Legacy compatibility exports ─────────────────────────────────────────────

export const useGetCallerUserProfile = useMyTransactions;
export const useReclaimAdminAccess = useReclaimAdmin;
