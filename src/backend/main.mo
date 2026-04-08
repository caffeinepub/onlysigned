import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import ExperimentalCycles "mo:base/ExperimentalCycles";

import Users "users";
import Assets "assets";
import Signing "signing";
import Marketplace "marketplace";
import Admin "admin";
import Chat "chat";


// ─── OnlySigned Backend ───────────────────────────────────────────────────────
// Composition root — imports all domain modules and wires state.
// No business logic lives here; all delegated to domain modules.
// Enhanced orthogonal persistence — no stable keyword needed.
// ─────────────────────────────────────────────────────────────────────────────


actor {

  // ═══════════════════════════════════════════════════════════════════
  // STATE — Users domain
  // ═══════════════════════════════════════════════════════════════════

  let usersMap     : Users.UsersMap  = Map.empty<Principal, Users.User>();
  let followMap    : Users.FollowMap = Map.empty<Principal, Set.Set<Principal>>();
  let followersMap : Users.FollowMap = Map.empty<Principal, Set.Set<Principal>>();
  var userCount    : Nat             = 0;

  // ═══════════════════════════════════════════════════════════════════
  // STATE — Assets domain
  // ═══════════════════════════════════════════════════════════════════

  let assetsState : Assets.State = Assets.State();

  // ═══════════════════════════════════════════════════════════════════
  // STATE — Signing domain
  // ═══════════════════════════════════════════════════════════════════

  let signingState : Signing.State = Signing.State();

  // ═══════════════════════════════════════════════════════════════════
  // STATE — Marketplace domain
  // ═══════════════════════════════════════════════════════════════════

  let listings   : Marketplace.Listings     = Map.empty<Text, Marketplace.MarketplaceListing>();
  let wallets    : Marketplace.Wallets      = Map.empty<Principal, Marketplace.WalletBalance>();
  let txs        : Marketplace.Transactions = Map.empty<Text, Marketplace.Transaction>();
  let auditLog   : Marketplace.AuditLog     = List.empty<Marketplace.AuditLogEntry>();
  let metricsMap : Marketplace.Metrics      = Map.empty<Text, Marketplace.DailyMetrics>();

  // ═══════════════════════════════════════════════════════════════════
  // STATE — Admin domain
  // ═══════════════════════════════════════════════════════════════════

  let usernameNFTs            : Map.Map<Text, Admin.UsernameNFT>    = Map.empty<Text, Admin.UsernameNFT>();
  let usernameOffers          : Map.Map<Text, Admin.UsernameOffer>  = Map.empty<Text, Admin.UsernameOffer>();
  let adminSupportSubmissions : Map.Map<Text, Admin.SupportSubmission> = Map.empty<Text, Admin.SupportSubmission>();

  // ═══════════════════════════════════════════════════════════════════
  // STATE — Chat domain
  // ═══════════════════════════════════════════════════════════════════

  let contactInvitations : Map.Map<Text, Chat.ContactInvitation>     = Chat.newInvitations();
  let contactsMap        : Map.Map<Principal, Set.Set<Principal>>     = Chat.newContacts();
  let messagesMap        : Map.Map<Text, Chat.Message>                = Chat.newMessages();
  let messagesByPairMap  : Map.Map<Text, [Text]>                      = Chat.newMessagesByPair();
  let assetSharesMap     : Map.Map<Text, Chat.AssetShare>             = Chat.newAssetShares();
  let chatSupportSubs    : Map.Map<Text, Chat.SupportSubmission>      = Chat.newSupportSubmissions();

  // ═══════════════════════════════════════════════════════════════════
  // SEQUENCE COUNTERS
  // ═══════════════════════════════════════════════════════════════════

  var seqInvite  : Nat = 0;
  var seqMsg     : Nat = 0;
  var seqSup     : Nat = 0;
  var seqOffer   : Nat = 0;
  var seqListing : Nat = 0;
  var seqTx      : Nat = 0;
  var seqCopy    : Nat = 0;

  // Canister ID cache
  var cachedCanisterId : ?Text = null;

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  func now() : Int { Time.now() };

  func mkId(prefix : Text, seq : Nat) : Text {
    prefix # "-" # seq.toText() # "-" # (now() / 1_000_000).toText()
  };

  func requireUser(caller : Principal) {
    if (caller.isAnonymous()) Runtime.trap("Unauthorized: must be logged in");
  };

  func isAdminCaller(caller : Principal) : Bool {
    Users.isAdmin(usersMap, caller)
  };

  func requireAdmin(caller : Principal) {
    if (not isAdminCaller(caller)) Runtime.trap("Unauthorized: admin only");
  };

  func callerCtx(caller : Principal) : Assets.CallerCtx {
    let profileType : Assets.ProfileKind = switch (usersMap.get(caller)) {
      case (?u) switch (u.profileType) {
        case (#CertificateIssuer) #CertificateIssuer;
        case (#Collector)         #Collector;
      };
      case null #Collector;
    };
    let fc : Nat = switch (usersMap.get(caller)) {
      case (?u) u.followerCount;
      case null 0;
    };
    { caller; isAdmin = isAdminCaller(caller); followerCount = fc; profileType }
  };

  func userDisplayName(p : Principal) : Text {
    switch (usersMap.get(p)) {
      case (?u) u.displayName;
      case null p.toText();
    }
  };

  func userCertIssuerType(p : Principal) : ?Text {
    switch (usersMap.get(p)) {
      case (?u) switch (u.certIssuerSubtype) {
        case (?#Celebrity)   ?"Celebrity";
        case (?#Government)  ?"Government";
        case (?#Institution) ?"Institution";
        case null null;
      };
      case null null;
    }
  };

  func resolveItemOwnership(itemType : Marketplace.ItemType, itemId : Text) : ?Marketplace.ItemOwnershipInfo {
    switch itemType {
      case (#SignedCopy) {
        switch (signingState.signedCopiesById.get(itemId)) {
          case null null;
          case (?sc) {
            let royaltyBps : Nat = switch (assetsState.assetsById.get(sc.assetId)) {
              case (?a) a.royaltyBps;
              case null 0;
            };
            ?{ ownerPrincipal = sc.ownerId; creatorPrincipal = sc.creatorId; royaltyBps }
          };
        }
      };
      case (#Collection) {
        switch (assetsState.collectionsById.get(itemId)) {
          case null null;
          case (?col) ?{ ownerPrincipal = col.ownerId; creatorPrincipal = col.ownerId; royaltyBps = 0 };
        }
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  public shared ({ caller }) func registerUser(displayName : Text) : async { #ok : Nat; #err : Text } {
    let result = Users.registerUser(usersMap, userCount, caller, displayName);
    switch result {
      case (#ok num) {
        userCount += 1;
        Marketplace.incrementNewUsers(metricsMap);
        #ok num
      };
      case (#err e) #err e;
    }
  };

  public query ({ caller }) func getMyProfile() : async ?Users.User {
    Users.getMyProfile(usersMap, caller)
  };

  public shared ({ caller }) func updateMyProfile(args : Users.UpdateProfileArgs) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.updateProfile(usersMap, caller, args)
  };

  public shared ({ caller }) func setUsername(username : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.setUsername(usersMap, caller, username)
  };

  public query func getUserProfile(principal : Principal) : async ?Users.User {
    Users.getUserByPrincipal(usersMap, principal)
  };

  public query func getUserByNumber(n : Nat) : async ?Users.User {
    Users.getUserByNumber(usersMap, n)
  };

  public query func searchUsers(filter : Users.SearchFilter) : async [Users.User] {
    Users.searchUsers(usersMap, filter, 100)
  };

  public query func getLatestActiveUsers(limit : Nat) : async [Users.User] {
    Users.getLatestActiveUsers(usersMap, limit)
  };

  public query func getAllUsers() : async [Users.User] {
    usersMap.values().toArray()
  };

  public query func getPublicProfile(principal : Principal) : async ?Users.User {
    usersMap.get(principal)
  };

  // ─── Following ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func followUser(target : Principal) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.followUser(usersMap, followMap, followersMap, caller, target)
  };

  public shared ({ caller }) func unfollowUser(target : Principal) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.unfollowUser(usersMap, followMap, followersMap, caller, target)
  };

  public query func getFollowers(principal : Principal) : async [Principal] {
    Users.getFollowers(followersMap, principal)
  };

  public query func getFollowing(principal : Principal) : async [Principal] {
    Users.getFollowing(followMap, principal)
  };

  public query ({ caller }) func checkIsFollowing(target : Principal) : async Bool {
    Users.checkIsFollowing(followMap, caller, target)
  };

  // ─── Admin user management ───────────────────────────────────────────────────

  public shared ({ caller }) func reclaimAdmin() : async { #ok; #err : Text } {
    requireUser(caller);
    Users.reclaimAdmin(usersMap, caller)
  };

  public shared ({ caller }) func setUserAdmin(target : Principal, adminValue : Bool) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.setUserAdmin(usersMap, caller, target, adminValue)
  };

  public shared ({ caller }) func setCertificateIssuerStatus(
    target   : Principal,
    isIssuer : Bool,
    subtype  : ?{ #Celebrity; #Government; #Institution },
  ) : async { #ok; #err : Text } {
    requireUser(caller);
    let sub : ?Users.IssuerSubtype = switch subtype {
      case (?#Celebrity)   ?(#Celebrity : Users.IssuerSubtype);
      case (?#Government)  ?(#Government : Users.IssuerSubtype);
      case (?#Institution) ?(#Institution : Users.IssuerSubtype);
      case null null;
    };
    Users.setCertificateIssuerStatus(usersMap, caller, target, isIssuer, sub)
  };

  // ═══════════════════════════════════════════════════════════════════
  // ASSETS
  // ═══════════════════════════════════════════════════════════════════

  public shared ({ caller }) func createAsset(
    name         : Text,
    description  : ?Text,
    basePrice    : Nat,
    royaltyBps   : Nat,
    collectionId : ?Text,
    fileRefs     : [Assets.FileRef],
  ) : async { #ok : Text; #err : Text } {
    // Backend guard: reject anonymous / invalid principals before any other logic
    if (caller.isAnonymous()) return #err("Authentication required. Please log in before creating an asset.");
    if (caller.toText() == "aaaaa-aa") return #err("Invalid principal. Please reconnect your Internet Identity.");
    if (caller.toText() == "") return #err("Empty principal. Please reconnect your Internet Identity.");
    requireUser(caller);
    let result = Assets.createAsset(assetsState, callerCtx(caller), name, description, basePrice, royaltyBps, collectionId, fileRefs);
    switch result {
      case (#ok _) {
        Marketplace.incrementAssetsUploaded(metricsMap);
        Users.touch(usersMap, caller);
      };
      case _ {};
    };
    result
  };

  public shared ({ caller }) func updateAsset(
    id            : Text,
    name          : Text,
    description   : ?Text,
    basePrice     : Nat,
    royaltyBps    : Nat,
    collectionId  : ?Text,
    privacyPublic : Bool,
    fileRefs      : [Assets.FileRef],
  ) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.touch(usersMap, caller);
    Assets.updateAsset(assetsState, callerCtx(caller), id, name, description, basePrice, royaltyBps, collectionId, privacyPublic, fileRefs)
  };

  public shared ({ caller }) func deleteAsset(id : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.touch(usersMap, caller);
    Assets.deleteAsset(assetsState, callerCtx(caller), id)
  };

  public query ({ caller }) func getMyAssets() : async [Assets.Asset] {
    Assets.getMyAssets(assetsState, caller)
  };

  public query ({ caller = _ }) func getPublicAssets(owner : Principal) : async [Assets.Asset] {
    Assets.getPublicAssets(assetsState, owner)
  };

  public query ({ caller }) func getAsset(id : Text) : async ?Assets.Asset {
    Assets.getAsset(assetsState, caller, id)
  };

  public shared ({ caller }) func registerFileReference(assetId : Text, fileRef : Assets.FileRef) : async { #ok; #err : Text } {
    requireUser(caller);
    Assets.registerFileReference(assetsState, callerCtx(caller), assetId, fileRef)
  };

  // ─── Collections ────────────────────────────────────────────────────────────

  public shared ({ caller }) func createCollection(
    name        : Text,
    description : ?Text,
  ) : async { #ok : Text; #err : Text } {
    requireUser(caller);
    Users.touch(usersMap, caller);
    Assets.createCollection(assetsState, callerCtx(caller), name, description)
  };

  public shared ({ caller }) func updateCollection(
    id            : Text,
    name          : Text,
    description   : ?Text,
    privacyPublic : Bool,
    forSale       : Bool,
    salePrice     : Nat,
    saleCurrency  : Text,
    saleMethod    : Assets.SaleMethod,
  ) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.touch(usersMap, caller);
    Assets.updateCollection(assetsState, callerCtx(caller), id, name, description, privacyPublic, forSale, salePrice, saleCurrency, saleMethod)
  };

  public shared ({ caller }) func deleteCollection(id : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.touch(usersMap, caller);
    Assets.deleteCollection(assetsState, callerCtx(caller), id)
  };

  public query ({ caller }) func getMyCollections() : async [Assets.Collection] {
    Assets.getMyCollections(assetsState, caller)
  };

  public query ({ caller = _ }) func getPublicCollections(owner : Principal) : async [Assets.Collection] {
    Assets.getPublicCollections(assetsState, owner)
  };

  public shared ({ caller }) func setCollectionForSale(
    id           : Text,
    forSale      : Bool,
    salePrice    : Nat,
    saleCurrency : Text,
    saleMethod   : Assets.SaleMethod,
  ) : async { #ok; #err : Text } {
    requireUser(caller);
    Users.touch(usersMap, caller);
    Assets.setCollectionForSale(assetsState, callerCtx(caller), id, forSale, salePrice, saleCurrency, saleMethod)
  };

  // ═══════════════════════════════════════════════════════════════════
  // SIGNING & CERTIFICATES
  // ═══════════════════════════════════════════════════════════════════

  public shared ({ caller }) func signAsset(
    assetId  : Text,
    price    : Nat,
    currency : Text,
  ) : async { #ok : Text; #err : Text } {
    requireUser(caller);
    let canIssue   = Users.canIssueCerts(usersMap, caller);
    let dName      = userDisplayName(caller);
    let issuerType = userCertIssuerType(caller);
    let result = Signing.signAsset(
      signingState,
      caller, assetId, price, currency,
      canIssue, dName, issuerType,
      mkId, func() : Nat { seqCopy += 1; seqCopy },
    );
    switch result {
      case (#ok copy) {
        Marketplace.incrementSignedCopiesCreated(metricsMap);
        Users.touch(usersMap, caller);
        #ok (copy.id)
      };
      case (#err e) #err e;
    }
  };

  public shared ({ caller }) func setSignedCopyPrivacy(id : Text, privacyPublic : Bool) : async { #ok; #err : Text } {
    requireUser(caller);
    Signing.setSignedCopyPrivacy(signingState, caller, id, privacyPublic, isAdminCaller(caller))
  };

  public query ({ caller }) func getSignedCopy(id : Text) : async ?Signing.SignedCopy {
    Signing.getSignedCopy(signingState, caller, id)
  };

  public query ({ caller }) func getMySignedCopies() : async [Signing.SignedCopy] {
    Signing.getMySignedCopies(signingState, caller)
  };

  public query ({ caller }) func getSignedCopiesForAsset(assetId : Text) : async [Signing.SignedCopy] {
    Signing.getSignedCopiesForAsset(signingState, caller, assetId)
  };

  public query ({ caller = _ }) func getPublicSignedCopies(owner : Principal) : async [Signing.SignedCopy] {
    Signing.getPublicSignedCopies(signingState, owner)
  };

  public query func getSignedCopyByUrl(url : Text) : async ?Signing.SignedCopy {
    Signing.getSignedCopyByUrl(signingState, url)
  };

  public query func validateCertificate(certificateId : Text) : async ?Signing.SignedCopy {
    Signing.validateCertificate(signingState, certificateId)
  };

  // ─── Co-Signing ─────────────────────────────────────────────────────────────

  public shared ({ caller }) func inviteCoSigner(
    signedCopyId : Text,
    invitee      : Principal,
  ) : async { #ok : Text; #err : Text } {
    requireUser(caller);
    let result = Signing.inviteCoSigner(
      signingState,
      caller, signedCopyId, invitee,
      mkId, func() : Nat { seqInvite += 1; seqInvite },
    );
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  public shared ({ caller }) func acceptCoSignInvitation(invitationId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    let dName      = userDisplayName(caller);
    let issuerType = userCertIssuerType(caller);
    let result = Signing.acceptCoSignInvitation(signingState, caller, invitationId, dName, issuerType);
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  public shared ({ caller }) func declineCoSignInvitation(invitationId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    let result = Signing.declineCoSignInvitation(signingState, caller, invitationId);
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  public query ({ caller }) func getMyCoSignInvitations() : async [Signing.CoSignInvitation] {
    Signing.getMyCoSignInvitations(signingState, caller)
  };

  public shared ({ caller }) func generateDownloadPackage(signedCopyId : Text) : async { #ok : Signing.DownloadManifest; #err : Text } {
    requireUser(caller);
    Signing.generateDownloadPackage(signingState, caller, signedCopyId)
  };

  // ═══════════════════════════════════════════════════════════════════
  // MARKETPLACE
  // ═══════════════════════════════════════════════════════════════════

  public type ListingFilter = {
    currency   : ?Text;
    saleMethod : ?Marketplace.SaleMethod;
    itemType   : ?Marketplace.ItemType;
  };

  public shared ({ caller }) func listForSale(
    itemType   : Marketplace.ItemType,
    itemId     : Text,
    price      : Nat,
    currency   : Text,
    saleMethod : Marketplace.SaleMethod,
  ) : async { #ok : Text; #err : Text } {
    requireUser(caller);
    let ownerOfItem : Principal = switch itemType {
      case (#SignedCopy) {
        switch (signingState.signedCopiesById.get(itemId)) {
          case null return #err("Signed copy not found");
          case (?sc) sc.ownerId;
        }
      };
      case (#Collection) {
        switch (assetsState.collectionsById.get(itemId)) {
          case null return #err("Collection not found");
          case (?col) col.ownerId;
        }
      };
    };
    seqListing += 1;
    let result = Marketplace.listForSale(listings, seqListing, caller, ownerOfItem, itemType, itemId, price, currency, saleMethod);
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  public shared ({ caller }) func delistItem(listingId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    let result = Marketplace.delistItem(listings, caller, listingId, isAdminCaller(caller));
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  public query func getListings(filter : ?ListingFilter) : async [Marketplace.MarketplaceListing] {
    let (currencyF, methodF, typeF) : (?Text, ?Marketplace.SaleMethod, ?Marketplace.ItemType) = switch filter {
      case null (null, null, null);
      case (?f) (f.currency, f.saleMethod, f.itemType);
    };
    Marketplace.getListings(listings, currencyF, methodF, typeF)
  };

  public query func getListing(id : Text) : async ?Marketplace.MarketplaceListing {
    Marketplace.getListing(listings, id)
  };

  public query func getPublicMarketplaceListings() : async [Marketplace.MarketplaceListing] {
    Marketplace.getListings(listings, null, null, null)
  };

  public shared ({ caller }) func purchaseItem(listingId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    let listingOpt = Marketplace.getListing(listings, listingId);
    let l = switch listingOpt {
      case null return #err("Listing not found");
      case (?x) x;
    };
    let itemInfo = switch (resolveItemOwnership(l.itemType, l.itemId)) {
      case null return #err("Item not found or already sold");
      case (?info) info;
    };
    seqTx += 1;
    let result = Marketplace.purchaseItem(listings, wallets, txs, auditLog, metricsMap, seqTx, caller, listingId, itemInfo);
    switch result {
      case (#ok _) {
        // Transfer item ownership
        switch (l.itemType) {
          case (#SignedCopy) ignore Signing.transferOwnership(signingState, l.itemId, caller);
          case (#Collection) {
            switch (assetsState.collectionsById.get(l.itemId)) {
              case null {};
              case (?col) {
                // Re-index collection ownership
                switch (assetsState.collectionsByOwner.get(col.ownerId)) {
                  case (?s) s.remove(l.itemId);
                  case null {};
                };
                assetsState.collectionsById.add(l.itemId, { col with ownerId = caller });
                let newSet : Set.Set<Text> = switch (assetsState.collectionsByOwner.get(caller)) {
                  case (?s) s;
                  case null {
                    let s = Set.empty<Text>();
                    assetsState.collectionsByOwner.add(caller, s);
                    s
                  };
                };
                newSet.add(l.itemId);
              };
            };
          };
        };
        Users.touch(usersMap, caller);
      };
      case _ {};
    };
    result
  };

  public shared ({ caller }) func placeBid(listingId : Text, amount : Nat) : async { #ok; #err : Text } {
    requireUser(caller);
    seqTx += 1;
    let result = Marketplace.placeBid(listings, wallets, txs, auditLog, seqTx, caller, listingId, amount);
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  // ─── Wallet ─────────────────────────────────────────────────────────────────

  public query ({ caller }) func getMyWallet() : async Marketplace.WalletBalance {
    Marketplace.getMyWallet(wallets, caller)
  };

  public shared ({ caller }) func depositFunds(currency : Text, amount : Nat) : async { #ok; #err : Text } {
    requireUser(caller);
    if (amount == 0) return #err("Amount must be greater than zero");
    seqTx += 1;
    Marketplace.depositFunds(wallets, txs, auditLog, seqTx, caller, amount, currency);
    #ok
  };

  public shared ({ caller }) func withdrawFunds(
    currency           : Text,
    amount             : Nat,
    destinationAddress : ?Text,
  ) : async { #ok; #err : Text } {
    requireUser(caller);
    seqTx += 1;
    Marketplace.withdrawFunds(wallets, txs, auditLog, seqTx, caller, amount, currency, destinationAddress)
  };

  public query ({ caller }) func getMyTransactions(offset : Nat, limit : Nat) : async [Marketplace.Transaction] {
    Marketplace.getMyTransactions(txs, caller, offset, limit)
  };

  public query ({ caller }) func getAllTransactions() : async [Marketplace.AuditLogEntry] {
    Marketplace.getAllTransactions(auditLog, isAdminCaller(caller))
  };

  public query func getDailyMetrics() : async Marketplace.DailyMetrics {
    Marketplace.getDailyMetrics(metricsMap)
  };

  public query ({ caller }) func getAllDailyMetrics() : async [Marketplace.DailyMetrics] {
    Marketplace.getAllDailyMetrics(metricsMap, isAdminCaller(caller))
  };

  // ═══════════════════════════════════════════════════════════════════
  // CONTACTS & MESSAGES
  // ═══════════════════════════════════════════════════════════════════

  public shared ({ caller }) func sendContactInvitation(to : Principal) : async { #ok; #err : Text } {
    requireUser(caller);
    let result = Chat.sendContactInvitation(
      caller, to, contactInvitations, contactsMap,
      mkId, seqInvite + 1,
    );
    switch result {
      case (#ok _) {
        seqInvite += 1;
        Users.touch(usersMap, caller);
        #ok
      };
      case (#err e) #err e;
    }
  };

  public shared ({ caller }) func acceptContactInvitation(invitationId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    let invOpt = contactInvitations.values().find(
      func (inv : Chat.ContactInvitation) : Bool { inv.id == invitationId }
    );
    switch invOpt {
      case null #err("Invitation not found");
      case (?inv) {
        let result = Chat.acceptContactInvitation(caller, inv.fromPrincipal, contactInvitations, contactsMap);
        switch result {
          case (#ok _) Users.touch(usersMap, caller);
          case _ {};
        };
        result
      };
    }
  };

  public shared ({ caller }) func declineContactInvitation(invitationId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    let invOpt = contactInvitations.values().find(
      func (inv : Chat.ContactInvitation) : Bool { inv.id == invitationId }
    );
    switch invOpt {
      case null #err("Invitation not found");
      case (?inv) Chat.declineContactInvitation(caller, inv.fromPrincipal, contactInvitations);
    }
  };

  public query ({ caller }) func getMyContacts() : async [Principal] {
    Chat.getMyContacts(caller, contactsMap)
  };

  public query ({ caller }) func getPendingInvitations() : async [Chat.ContactInvitation] {
    Chat.getPendingInvitations(caller, contactInvitations)
  };

  public shared ({ caller }) func sendMessage(to : Principal, content : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    let result = Chat.sendMessage(
      caller, to, content,
      contactsMap, messagesMap, messagesByPairMap,
      mkId, seqMsg + 1,
    );
    switch result {
      case (#ok _) {
        seqMsg += 1;
        Users.touch(usersMap, caller);
        #ok
      };
      case (#err e) #err e;
    }
  };

  public query ({ caller }) func getMessages(with_ : Principal) : async [Chat.Message] {
    switch (Chat.getMessages(caller, with_, messagesMap, messagesByPairMap)) {
      case (#ok msgs) msgs;
      case (#err _)   [];
    }
  };

  public shared ({ caller }) func markMessageRead(messageId : Text) : async { #ok; #err : Text } {
    Chat.markMessageRead(caller, messageId, messagesMap)
  };

  public shared ({ caller }) func shareAssetWithContact(assetId : Text, with_ : Principal) : async { #ok; #err : Text } {
    requireUser(caller);
    let assetOwner : Principal = switch (assetsState.assetsById.get(assetId)) {
      case null return #err("Asset not found");
      case (?a) a.ownerId;
    };
    let result = Chat.shareAssetWithContact(caller, assetId, assetOwner, with_, contactsMap, assetSharesMap);
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  public shared ({ caller }) func revokeAssetShare(assetId : Text, with_ : Principal) : async { #ok; #err : Text } {
    requireUser(caller);
    let result = Chat.revokeAssetShare(caller, assetId, with_, assetSharesMap);
    switch result {
      case (#ok _) Users.touch(usersMap, caller);
      case _ {};
    };
    result
  };

  public query ({ caller }) func getSharedAssetsWithMe() : async [Chat.AssetShare] {
    Chat.getSharedAssetsWithMe(caller, assetSharesMap)
  };

  // ═══════════════════════════════════════════════════════════════════
  // USERNAME NFTs
  // ═══════════════════════════════════════════════════════════════════

  public shared ({ caller }) func mintUsernameNFT(username : Text, forPrincipal : Principal) : async { #ok; #err : Text } {
    requireUser(caller);
    if (not isAdminCaller(caller)) return #err("Only admins can mint Username NFTs");
    if (username.isEmpty()) return #err("Username is required");
    if (usernameNFTs.containsKey(username)) return #err("UsernameNFT for that username already exists");
    usernameNFTs.add(username, {
      id              = "unft-" # username;
      username;
      ownerPrincipal  = forPrincipal;
      mintedBy        = caller;
      mintedAt        = now();
      transferHistory = [];
    });
    Users.grantUsernameNFT(usersMap, forPrincipal);
    Users.touch(usersMap, caller);
    #ok
  };

  public shared ({ caller }) func transferUsernameNFT(username : Text, toPrincipal : Principal) : async { #ok; #err : Text } {
    requireUser(caller);
    if (not isAdminCaller(caller)) return #err("Only admins can transfer Username NFTs");
    switch (usernameNFTs.get(username)) {
      case null return #err("UsernameNFT not found");
      case (?nft) {
        let record : Admin.TransferRecord = { from = nft.ownerPrincipal; to = toPrincipal; at = now() };
        if (nft.ownerPrincipal != toPrincipal) {
          Users.revokeUsernameNFT(usersMap, nft.ownerPrincipal);
        };
        usernameNFTs.add(username, {
          nft with
          ownerPrincipal  = toPrincipal;
          transferHistory = nft.transferHistory.concat([record]);
        });
        Users.grantUsernameNFT(usersMap, toPrincipal);
        Users.touch(usersMap, caller);
        #ok
      };
    }
  };

  public query ({ caller }) func getAllUsernameNFTs() : async [Admin.UsernameNFT] {
    if (not isAdminCaller(caller)) Runtime.trap("Admin only");
    usernameNFTs.values().toArray()
  };

  public query func getUsernameNFT(username : Text) : async ?Admin.UsernameNFT {
    usernameNFTs.get(username)
  };

  public shared ({ caller }) func submitUsernameOffer(
    username : Text,
    amount   : Nat,
    currency : Text,
  ) : async { #ok : Text; #err : Text } {
    requireUser(caller);
    seqOffer += 1;
    let id = mkId("uoff", seqOffer);
    usernameOffers.add(id, {
      id;
      offererPrincipal = caller;
      targetUsername   = username;
      amount;
      currency;
      submittedAt      = now();
      status           = #Pending;
      nftExists        = usernameNFTs.containsKey(username);
    });
    Users.touch(usersMap, caller);
    #ok id
  };

  public query ({ caller }) func getMyUsernameOffers() : async [Admin.UsernameOffer] {
    usernameOffers.values()
      .filter(func (o : Admin.UsernameOffer) : Bool { o.offererPrincipal == caller })
      .toArray()
  };

  public query ({ caller }) func getAllUsernameOffers() : async [Admin.UsernameOffer] {
    if (not isAdminCaller(caller)) Runtime.trap("Admin only");
    usernameOffers.values().toArray()
  };

  public shared ({ caller }) func acceptUsernameOffer(offerId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    if (not isAdminCaller(caller)) return #err("Admin only");
    switch (usernameOffers.get(offerId)) {
      case null return #err("Offer not found");
      case (?offer) {
        if (offer.status != #Pending) return #err("Offer is not pending");
        // Charge buyer wallet if amount > 0
        if (offer.amount > 0) {
          seqTx += 1;
          let debitResult = Marketplace.withdrawFunds(wallets, txs, auditLog, seqTx, offer.offererPrincipal, offer.amount, offer.currency, null);
          switch debitResult {
            case (#err e) return #err("Buyer payment failed: " # e);
            case (#ok _) {
              seqTx += 1;
              Marketplace.depositFunds(wallets, txs, auditLog, seqTx, caller, offer.amount, offer.currency);
            };
          };
        };
        // Mint or transfer NFT
        switch (usernameNFTs.get(offer.targetUsername)) {
          case null {
            usernameNFTs.add(offer.targetUsername, {
              id              = "unft-" # offer.targetUsername;
              username        = offer.targetUsername;
              ownerPrincipal  = offer.offererPrincipal;
              mintedBy        = caller;
              mintedAt        = now();
              transferHistory = [];
            });
          };
          case (?nft) {
            let record : Admin.TransferRecord = {
              from = nft.ownerPrincipal;
              to   = offer.offererPrincipal;
              at   = now();
            };
            if (nft.ownerPrincipal != offer.offererPrincipal) {
              Users.revokeUsernameNFT(usersMap, nft.ownerPrincipal);
            };
            usernameNFTs.add(offer.targetUsername, {
              nft with
              ownerPrincipal  = offer.offererPrincipal;
              transferHistory = nft.transferHistory.concat([record]);
            });
          };
        };
        Users.grantUsernameNFT(usersMap, offer.offererPrincipal);
        usernameOffers.add(offerId, { offer with status = #Accepted });
        #ok
      };
    }
  };

  public shared ({ caller }) func rejectUsernameOffer(offerId : Text) : async { #ok; #err : Text } {
    requireUser(caller);
    if (not isAdminCaller(caller)) return #err("Admin only");
    switch (usernameOffers.get(offerId)) {
      case null return #err("Offer not found");
      case (?offer) {
        if (offer.status != #Pending) return #err("Offer is not pending");
        usernameOffers.add(offerId, { offer with status = #Rejected });
        #ok
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SUPPORT FORM
  // ═══════════════════════════════════════════════════════════════════

  public shared ({ caller }) func submitSupportForm(
    subject : Text,
    message : Text,
    email   : ?Text,
  ) : async { #ok; #err : Text } {
    let submitter = if (caller.isAnonymous()) null else ?caller;
    switch (Chat.submitSupportForm(submitter, subject, message, email, chatSupportSubs, mkId, seqSup + 1)) {
      case (#ok _) { seqSup += 1; #ok };
      case (#err e) #err e;
    }
  };

  public query ({ caller }) func getAllSupportSubmissions() : async [Admin.SupportSubmission] {
    if (not isAdminCaller(caller)) Runtime.trap("Admin only");
    adminSupportSubmissions.values().toArray()
  };

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN STATS & CANISTER
  // ═══════════════════════════════════════════════════════════════════

  public query ({ caller }) func getAdminStats() : async Admin.AdminStats {
    requireAdmin(caller);
    let thirtyDaysNs : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let thirtyDaysAgo = now() - thirtyDaysNs;
    let activeCount = usersMap.values()
      .filter(func (u : Users.User) : Bool { u.lastActiveTime >= thirtyDaysAgo })
      .size();
    {
      totalUsers             = usersMap.size();
      activeUsersLast30Days  = activeCount;
      totalAssets            = assetsState.assetsById.size();
      totalSignedCopies      = Signing.size(signingState);
      totalTransactions      = txs.size();
      totalMarketplaceVolume = 0;
    }
  };

  public shared func getCanisterId() : async Admin.CanisterIdResult {
    switch cachedCanisterId {
      case (?id) Admin.makeCanisterIdResult(id, "cached");
      case null  {
        let id = "unknown-use-env-vars";
        cachedCanisterId := ?id;
        Admin.makeCanisterIdResult(id, "fallback")
      };
    }
  };

  public func getCyclesBalance() : async Nat {
    ExperimentalCycles.balance()
  };

  public shared ({ caller }) func setCanisterId(id : Text) : async { #ok; #err : Text } {
    if (not isAdminCaller(caller)) return #err("Admin only");
    cachedCanisterId := ?id;
    #ok
  };

  // ═══════════════════════════════════════════════════════════════════
  // DOMAIN VERIFICATION
  // ═══════════════════════════════════════════════════════════════════

  public query func getWellKnownDomainVerification() : async Text {
    Chat.getWellKnownDomainVerification()
  };

};
