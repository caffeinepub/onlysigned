/**
 * Type-safe re-export shim for backend types.
 * Fixes the `with` reserved-keyword issue in auto-generated backend.ts / backend.d.ts
 * by renaming `with` parameters to `_with`.
 *
 * All source files should import from this file instead of "./backend" or "./backend.d.ts".
 * At runtime, Vite resolves "./backend" to the real implementation via its load() plugin.
 */
import type { Principal } from "@icp-sdk/core/principal";

// ─── Value types ─────────────────────────────────────────────────────────────

export interface Some<T> {
  __kind__: "Some";
  value: T;
}
export interface None {
  __kind__: "None";
}
export type Option<T> = Some<T> | None;

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum IssuerSubtype {
  Institution = "Institution",
  Celebrity = "Celebrity",
  Government = "Government",
}
export enum ItemType {
  Collection = "Collection",
  SignedCopy = "SignedCopy",
}
export enum OfferStatus {
  Rejected = "Rejected",
  Accepted = "Accepted",
  Pending = "Pending",
}
export enum ProfileType {
  Collector = "Collector",
  CertificateIssuer = "CertificateIssuer",
}
export enum SaleMethod {
  Auction = "Auction",
  Direct = "Direct",
}
export enum SubmissionStatus {
  Reviewed = "Reviewed",
  Pending = "Pending",
}
export enum TxType {
  Bid = "Bid",
  Deposit = "Deposit",
  Sale = "Sale",
  Withdrawal = "Withdrawal",
  Royalty = "Royalty",
  OfferPayment = "OfferPayment",
  Purchase = "Purchase",
}
export enum Variant_Accepted_Declined_Pending {
  Accepted = "Accepted",
  Declined = "Declined",
  Pending = "Pending",
}
export enum Variant_UserNumber_LastActive_RegistrationTime_FollowerCount {
  UserNumber = "UserNumber",
  LastActive = "LastActive",
  RegistrationTime = "RegistrationTime",
  FollowerCount = "FollowerCount",
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface UsernameOffer {
  id: string;
  status: OfferStatus;
  targetUsername: string;
  nftExists: boolean;
  offererPrincipal: Principal;
  submittedAt: bigint;
  currency: string;
  amount: bigint;
}
export interface TransferRecord {
  at: bigint;
  to: Principal;
  from: Principal;
}
export interface SignedCopy {
  id: string;
  saleMethod?: SaleMethod;
  tokenId: bigint;
  ownerId: Principal;
  assetId: string;
  signers: Array<SignerInfo>;
  createdAt: bigint;
  creatorId: Principal;
  listingPrice?: bigint;
  authenticityHash: string;
  certificateId: string;
  listedForSale: boolean;
  privacyPublic: boolean;
  currency: string;
  listingCurrency?: string;
  shareableUrl: string;
  sequenceNumber: bigint;
  price: bigint;
}
export interface SupportSubmission {
  id: string;
  status: SubmissionStatus;
  subject: string;
  submitterPrincipal?: Principal;
  submittedAt: bigint;
  email?: string;
  message: string;
}
export interface FileRef {
  mimeType: string;
  filename: string;
  fileId: string;
  sizeBytes: bigint;
}
export interface Transaction {
  id: string;
  itemId?: string;
  destinationAddress?: string;
  toPrincipal: Principal;
  fromPrincipal?: Principal;
  currency: string;
  timestamp: bigint;
  txType: TxType;
  amount: bigint;
}
export interface UpdateProfileArgs {
  bio: string;
  personalUrl?: string;
  displayName: string;
  birthdate?: string;
  profilePhoto?: string;
  email?: string;
  certIssuerSubtype?: IssuerSubtype;
  profileType: ProfileType;
}
export interface DownloadManifest {
  tokenId: bigint;
  icrc7Metadata: ICRC7Metadata;
  assetId: string;
  signers: Array<SignerInfo>;
  generatedAt: bigint;
  authenticityHash: string;
  certificateId: string;
  shareableUrl: string;
  sequenceNumber: bigint;
  copyId: string;
}
export interface MarketplaceListing {
  id: string;
  itemId: string;
  sellerPrincipal: Principal;
  saleMethod: SaleMethod;
  active: boolean;
  highestBidder?: Principal;
  listedAt: bigint;
  highestBid?: bigint;
  currency: string;
  itemType: ItemType;
  price: bigint;
}
export interface CoSignInvitation {
  id: string;
  status: Variant_Accepted_Declined_Pending;
  inviterPrincipal: Principal;
  signedCopyId: string;
  inviteePrincipal: Principal;
  createdAt: bigint;
}
export interface ICRC7Metadata {
  tokenId: bigint;
  assetId: string;
  signers: Array<SignerInfo>;
  creatorId: Principal;
  authenticityHash: string;
  certificateId: string;
  shareableUrl: string;
  sequenceNumber: bigint;
}
export interface Asset {
  id: string;
  royaltyBps: bigint;
  collectionId?: string;
  ownerId: Principal;
  name: string;
  createdAt: bigint;
  description?: string;
  fileRefs: Array<FileRef>;
  updatedAt: bigint;
  privacyPublic: boolean;
  basePrice: bigint;
}
export interface DailyMetrics {
  date: string;
  totalTransactionVolume: bigint;
  signedCopiesCreated: bigint;
  salesCompleted: bigint;
  newUsers: bigint;
  assetsUploaded: bigint;
}
export interface WalletBalance {
  icp: bigint;
  ckbtc: bigint;
  ckusdc: bigint;
  ckusdt: bigint;
}
export interface User {
  id: Principal;
  bio: string;
  personalUrl?: string;
  username?: string;
  displayName: string;
  birthdate?: string;
  profilePhoto?: string;
  lastActiveTime: bigint;
  email?: string;
  isVerified: boolean;
  userNumber: bigint;
  hasUsernameNFT: boolean;
  certIssuerSubtype?: IssuerSubtype;
  followerCount: bigint;
  isAdmin: boolean;
  followingCount: bigint;
  registrationTime: bigint;
  profileType: ProfileType;
}
export interface SearchFilter {
  subtype?: IssuerSubtype;
  sortBy: Variant_UserNumber_LastActive_RegistrationTime_FollowerCount;
  searchText: string;
  onlyVerified: boolean;
  onlyAdmin: boolean;
  profileType?: ProfileType;
  minFollowers?: bigint;
}
export interface ContactInvitation {
  id: string;
  status: InvitationStatus;
  createdAt: bigint;
  toPrincipal: Principal;
  fromPrincipal: Principal;
}
export interface AuditLogEntry {
  id: string;
  itemId?: string;
  destinationAddress?: string;
  toPrincipal: Principal;
  fromPrincipal?: Principal;
  currency: string;
  timestamp: bigint;
  txType: TxType;
  amount: bigint;
}
export interface UsernameNFT {
  id: string;
  username: string;
  ownerPrincipal: Principal;
  transferHistory: Array<TransferRecord>;
  mintedAt: bigint;
  mintedBy: Principal;
}
export interface AssetShare {
  revoked: boolean;
  assetId: string;
  ownerPrincipal: Principal;
  sharedAt: bigint;
  sharedWithPrincipal: Principal;
}
export interface ListingFilter {
  saleMethod?: SaleMethod;
  currency?: string;
  itemType?: ItemType;
}
export interface Collection {
  id: string;
  saleMethod: SaleMethod;
  saleCurrency: string;
  ownerId: Principal;
  name: string;
  createdAt: bigint;
  description?: string;
  privacyPublic: boolean;
  salePrice: bigint;
  forSale: boolean;
}
export interface AdminStats {
  totalAssets: bigint;
  totalSignedCopies: bigint;
  activeUsersLast30Days: bigint;
  totalUsers: bigint;
  totalTransactions: bigint;
  totalMarketplaceVolume: bigint;
}
export interface CanisterIdResult {
  detectionMethod: string;
  canisterId: string;
}
export interface Message {
  id: string;
  content: string;
  sentAt: bigint;
  toPrincipal: Principal;
  fromPrincipal: Principal;
  readAt?: bigint;
}
export interface SignerInfo {
  certIssuerType?: string;
  principal: Principal;
  signature: string;
  displayName: string;
  signedAt: bigint;
}

// ─── Invitation status (used in ContactInvitation) ───────────────────────────
export enum InvitationStatus {
  Accepted = "Accepted",
  Declined = "Declined",
  Pending = "Pending",
}

// ─── FileReference (used by blob-storage) ────────────────────────────────────
export interface FileReference {
  path: string;
  hash: string;
  size: bigint;
  mimeType: string;
  uploadedAt: bigint;
}

// ─── ExternalBlob ─────────────────────────────────────────────────────────────

export declare class ExternalBlob {
  _blob?: Uint8Array<ArrayBufferLike> | null;
  directURL: string;
  onProgress?: (percentage: number) => void;
  static fromURL(url: string): ExternalBlob;
  static fromBytes(blob: Uint8Array<ArrayBufferLike>): ExternalBlob;
  getBytes(): Promise<Uint8Array<ArrayBufferLike>>;
  getDirectURL(): string;
  withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}

// ─── Backend interface with `with` renamed to `_with` ─────────────────────────

export interface backendInterface {
  acceptCoSignInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  acceptContactInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  acceptUsernameOffer(
    offerId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  checkIsFollowing(target: Principal): Promise<boolean>;
  createAsset(
    name: string,
    description: string | null,
    basePrice: bigint,
    royaltyBps: bigint,
    collectionId: string | null,
    fileRefs: Array<FileRef>,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  createCollection(
    name: string,
    description: string | null,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  declineCoSignInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  declineContactInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  deleteAsset(
    id: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  deleteCollection(
    id: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  delistItem(
    listingId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  depositFunds(
    currency: string,
    amount: bigint,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  followUser(
    target: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  generateDownloadPackage(
    signedCopyId: string,
  ): Promise<
    { __kind__: "ok"; ok: DownloadManifest } | { __kind__: "err"; err: string }
  >;
  getAdminStats(): Promise<AdminStats>;
  getAllDailyMetrics(): Promise<Array<DailyMetrics>>;
  getAllSupportSubmissions(): Promise<Array<SupportSubmission>>;
  getAllTransactions(): Promise<Array<AuditLogEntry>>;
  getAllUsernameNFTs(): Promise<Array<UsernameNFT>>;
  getAllUsernameOffers(): Promise<Array<UsernameOffer>>;
  getAllUsers(): Promise<Array<User>>;
  getAsset(id: string): Promise<Asset | null>;
  getCanisterId(): Promise<CanisterIdResult>;
  getCyclesBalance(): Promise<bigint>;
  getDailyMetrics(): Promise<DailyMetrics>;
  getFollowers(principal: Principal): Promise<Array<Principal>>;
  getFollowing(principal: Principal): Promise<Array<Principal>>;
  getLatestActiveUsers(limit: bigint): Promise<Array<User>>;
  getListing(id: string): Promise<MarketplaceListing | null>;
  getListings(filter: ListingFilter | null): Promise<Array<MarketplaceListing>>;
  getMessages(_with: Principal): Promise<Array<Message>>;
  getMyAssets(): Promise<Array<Asset>>;
  getMyCoSignInvitations(): Promise<Array<CoSignInvitation>>;
  getMyCollections(): Promise<Array<Collection>>;
  getMyContacts(): Promise<Array<Principal>>;
  getMyProfile(): Promise<User | null>;
  getMySignedCopies(): Promise<Array<SignedCopy>>;
  getMyTransactions(offset: bigint, limit: bigint): Promise<Array<Transaction>>;
  getMyUsernameOffers(): Promise<Array<UsernameOffer>>;
  getMyWallet(): Promise<WalletBalance>;
  getPendingInvitations(): Promise<Array<ContactInvitation>>;
  getPublicAssets(owner: Principal): Promise<Array<Asset>>;
  getPublicCollections(owner: Principal): Promise<Array<Collection>>;
  getPublicMarketplaceListings(): Promise<Array<MarketplaceListing>>;
  getPublicProfile(principal: Principal): Promise<User | null>;
  getPublicSignedCopies(owner: Principal): Promise<Array<SignedCopy>>;
  getSharedAssetsWithMe(): Promise<Array<AssetShare>>;
  getSignedCopiesForAsset(assetId: string): Promise<Array<SignedCopy>>;
  getSignedCopy(id: string): Promise<SignedCopy | null>;
  getSignedCopyByUrl(url: string): Promise<SignedCopy | null>;
  getUserByNumber(n: bigint): Promise<User | null>;
  getUserProfile(principal: Principal): Promise<User | null>;
  getUsernameNFT(username: string): Promise<UsernameNFT | null>;
  getWellKnownDomainVerification(): Promise<string>;
  inviteCoSigner(
    signedCopyId: string,
    invitee: Principal,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  listForSale(
    itemType: ItemType,
    itemId: string,
    price: bigint,
    currency: string,
    saleMethod: SaleMethod,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  markMessageRead(
    messageId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  mintUsernameNFT(
    username: string,
    forPrincipal: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  placeBid(
    listingId: string,
    amount: bigint,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  purchaseItem(
    listingId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  reclaimAdmin(): Promise<
    { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
  >;
  registerFileReference(
    assetId: string,
    fileRef: FileRef,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  registerUser(
    displayName: string,
  ): Promise<{ __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }>;
  rejectUsernameOffer(
    offerId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  revokeAssetShare(
    assetId: string,
    _with: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  searchUsers(filter: SearchFilter): Promise<Array<User>>;
  sendContactInvitation(
    to: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  sendMessage(
    to: Principal,
    content: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setCanisterId(
    id: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setCertificateIssuerStatus(
    target: Principal,
    isIssuer: boolean,
    subtype: IssuerSubtype | null,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setCollectionForSale(
    id: string,
    forSale: boolean,
    salePrice: bigint,
    saleCurrency: string,
    saleMethod: SaleMethod,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setSignedCopyPrivacy(
    id: string,
    privacyPublic: boolean,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setUserAdmin(
    target: Principal,
    adminValue: boolean,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setUsername(
    username: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  shareAssetWithContact(
    assetId: string,
    _with: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  signAsset(
    assetId: string,
    price: bigint,
    currency: string,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  submitSupportForm(
    subject: string,
    message: string,
    email: string | null,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  submitUsernameOffer(
    username: string,
    amount: bigint,
    currency: string,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  transferUsernameNFT(
    username: string,
    toPrincipal: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  unfollowUser(
    target: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  updateAsset(
    id: string,
    name: string,
    description: string | null,
    basePrice: bigint,
    royaltyBps: bigint,
    collectionId: string | null,
    privacyPublic: boolean,
    fileRefs: Array<FileRef>,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  updateCollection(
    id: string,
    name: string,
    description: string | null,
    privacyPublic: boolean,
    forSale: boolean,
    salePrice: bigint,
    saleCurrency: string,
    saleMethod: SaleMethod,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  updateMyProfile(
    args: UpdateProfileArgs,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  validateCertificate(certificateId: string): Promise<SignedCopy | null>;
  withdrawFunds(
    currency: string,
    amount: bigint,
    destinationAddress: string | null,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  listFileReferences(): Promise<Array<FileReference>>;
  getFileReference(path: string): Promise<FileReference | null>;
  dropFileReference(
    path: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
}

// ─── Backend class (type-only declaration) ────────────────────────────────────

export declare class Backend implements backendInterface {
  acceptCoSignInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  acceptContactInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  acceptUsernameOffer(
    offerId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  checkIsFollowing(target: Principal): Promise<boolean>;
  createAsset(
    name: string,
    description: string | null,
    basePrice: bigint,
    royaltyBps: bigint,
    collectionId: string | null,
    fileRefs: Array<FileRef>,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  createCollection(
    name: string,
    description: string | null,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  declineCoSignInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  declineContactInvitation(
    invitationId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  deleteAsset(
    id: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  deleteCollection(
    id: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  delistItem(
    listingId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  depositFunds(
    currency: string,
    amount: bigint,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  followUser(
    target: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  generateDownloadPackage(
    signedCopyId: string,
  ): Promise<
    { __kind__: "ok"; ok: DownloadManifest } | { __kind__: "err"; err: string }
  >;
  getAdminStats(): Promise<AdminStats>;
  getAllDailyMetrics(): Promise<Array<DailyMetrics>>;
  getAllSupportSubmissions(): Promise<Array<SupportSubmission>>;
  getAllTransactions(): Promise<Array<AuditLogEntry>>;
  getAllUsernameNFTs(): Promise<Array<UsernameNFT>>;
  getAllUsernameOffers(): Promise<Array<UsernameOffer>>;
  getAllUsers(): Promise<Array<User>>;
  getAsset(id: string): Promise<Asset | null>;
  getCanisterId(): Promise<CanisterIdResult>;
  getCyclesBalance(): Promise<bigint>;
  getDailyMetrics(): Promise<DailyMetrics>;
  getFollowers(principal: Principal): Promise<Array<Principal>>;
  getFollowing(principal: Principal): Promise<Array<Principal>>;
  getLatestActiveUsers(limit: bigint): Promise<Array<User>>;
  getListing(id: string): Promise<MarketplaceListing | null>;
  getListings(filter: ListingFilter | null): Promise<Array<MarketplaceListing>>;
  getMessages(_with: Principal): Promise<Array<Message>>;
  getMyAssets(): Promise<Array<Asset>>;
  getMyCoSignInvitations(): Promise<Array<CoSignInvitation>>;
  getMyCollections(): Promise<Array<Collection>>;
  getMyContacts(): Promise<Array<Principal>>;
  getMyProfile(): Promise<User | null>;
  getMySignedCopies(): Promise<Array<SignedCopy>>;
  getMyTransactions(offset: bigint, limit: bigint): Promise<Array<Transaction>>;
  getMyUsernameOffers(): Promise<Array<UsernameOffer>>;
  getMyWallet(): Promise<WalletBalance>;
  getPendingInvitations(): Promise<Array<ContactInvitation>>;
  getPublicAssets(owner: Principal): Promise<Array<Asset>>;
  getPublicCollections(owner: Principal): Promise<Array<Collection>>;
  getPublicMarketplaceListings(): Promise<Array<MarketplaceListing>>;
  getPublicProfile(principal: Principal): Promise<User | null>;
  getPublicSignedCopies(owner: Principal): Promise<Array<SignedCopy>>;
  getSharedAssetsWithMe(): Promise<Array<AssetShare>>;
  getSignedCopiesForAsset(assetId: string): Promise<Array<SignedCopy>>;
  getSignedCopy(id: string): Promise<SignedCopy | null>;
  getSignedCopyByUrl(url: string): Promise<SignedCopy | null>;
  getUserByNumber(n: bigint): Promise<User | null>;
  getUserProfile(principal: Principal): Promise<User | null>;
  getUsernameNFT(username: string): Promise<UsernameNFT | null>;
  getWellKnownDomainVerification(): Promise<string>;
  inviteCoSigner(
    signedCopyId: string,
    invitee: Principal,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  listForSale(
    itemType: ItemType,
    itemId: string,
    price: bigint,
    currency: string,
    saleMethod: SaleMethod,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  markMessageRead(
    messageId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  mintUsernameNFT(
    username: string,
    forPrincipal: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  placeBid(
    listingId: string,
    amount: bigint,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  purchaseItem(
    listingId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  reclaimAdmin(): Promise<
    { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
  >;
  registerFileReference(
    assetId: string,
    fileRef: FileRef,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  registerUser(
    displayName: string,
  ): Promise<{ __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }>;
  rejectUsernameOffer(
    offerId: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  revokeAssetShare(
    assetId: string,
    _with: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  searchUsers(filter: SearchFilter): Promise<Array<User>>;
  sendContactInvitation(
    to: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  sendMessage(
    to: Principal,
    content: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setCanisterId(
    id: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setCertificateIssuerStatus(
    target: Principal,
    isIssuer: boolean,
    subtype: IssuerSubtype | null,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setCollectionForSale(
    id: string,
    forSale: boolean,
    salePrice: bigint,
    saleCurrency: string,
    saleMethod: SaleMethod,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setSignedCopyPrivacy(
    id: string,
    privacyPublic: boolean,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setUserAdmin(
    target: Principal,
    adminValue: boolean,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  setUsername(
    username: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  shareAssetWithContact(
    assetId: string,
    _with: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  signAsset(
    assetId: string,
    price: bigint,
    currency: string,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  submitSupportForm(
    subject: string,
    message: string,
    email: string | null,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  submitUsernameOffer(
    username: string,
    amount: bigint,
    currency: string,
  ): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
  transferUsernameNFT(
    username: string,
    toPrincipal: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  unfollowUser(
    target: Principal,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  updateAsset(
    id: string,
    name: string,
    description: string | null,
    basePrice: bigint,
    royaltyBps: bigint,
    collectionId: string | null,
    privacyPublic: boolean,
    fileRefs: Array<FileRef>,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  updateCollection(
    id: string,
    name: string,
    description: string | null,
    privacyPublic: boolean,
    forSale: boolean,
    salePrice: bigint,
    saleCurrency: string,
    saleMethod: SaleMethod,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  updateMyProfile(
    args: UpdateProfileArgs,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  validateCertificate(certificateId: string): Promise<SignedCopy | null>;
  withdrawFunds(
    currency: string,
    amount: bigint,
    destinationAddress: string | null,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  listFileReferences(): Promise<Array<FileReference>>;
  getFileReference(path: string): Promise<FileReference | null>;
  dropFileReference(
    path: string,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
}

// ─── CreateActorOptions ────────────────────────────────────────────────────────

export interface CreateActorOptions {
  agent?: unknown;
  agentOptions?: unknown;
  actorOptions?: unknown;
  processError?: (error: unknown) => never;
}

// ─── createActor function (type-only declaration) ─────────────────────────────

export declare function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): Backend;
