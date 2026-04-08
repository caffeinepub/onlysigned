import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";

// ─── Assets & Collections Domain Module ───────────────────────────────────────
// Manages digital assets, file references, and collections.
// All items default to private (privacyPublic = false).
// Certificate Issuers need 500+ followers to create assets/collections (admin exempt).
// ─────────────────────────────────────────────────────────────────────────────

module {

  // ═══════════════════════════════════════════════════════════════════
  // TYPES
  // ═══════════════════════════════════════════════════════════════════

  public type FileRef = {
    fileId    : Text;
    filename  : Text;
    mimeType  : Text;
    sizeBytes : Nat;
  };

  public type Asset = {
    id            : Text;
    ownerId       : Principal;
    name          : Text;
    description   : ?Text;
    basePrice     : Nat;
    royaltyBps    : Nat;       // basis points 0–10000
    collectionId  : ?Text;
    privacyPublic : Bool;
    fileRefs      : [FileRef];
    createdAt     : Int;
    updatedAt     : Int;
  };

  public type SaleMethod = { #Direct; #Auction };

  public type Collection = {
    id            : Text;
    ownerId       : Principal;
    name          : Text;
    description   : ?Text;
    privacyPublic : Bool;
    forSale       : Bool;
    salePrice     : Nat;
    saleCurrency  : Text;
    saleMethod    : SaleMethod;
    createdAt     : Int;
  };

  // ─── Caller context passed in from main.mo ──────────────────────────────────
  // Carries everything needed for authorization without coupling to User types.

  public type ProfileKind = { #Collector; #CertificateIssuer };

  public type CallerCtx = {
    caller        : Principal;
    isAdmin       : Bool;
    followerCount : Nat;
    profileType   : ProfileKind;
  };

  // ─── Mutable module state ────────────────────────────────────────────────────
  // Exposed as a class so callers can hold a single `Assets.State` reference
  // that persists in the actor's enhanced-orthogonal-persistence memory.

  public class State() {
    public let assetsById         : Map.Map<Text, Asset>                   = Map.empty();
    public let collectionsByOwner : Map.Map<Principal, Set.Set<Text>>      = Map.empty();
    public let collectionsById    : Map.Map<Text, Collection>              = Map.empty();
    public var assetCounter       : Nat                                    = 0;
    public var collectionCounter  : Nat                                    = 0;
  };

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  func now() : Int { Time.now() };

  func genAssetId(state : State) : Text {
    state.assetCounter += 1;
    "asset-" # state.assetCounter.toText() # "-" # (now() / 1_000_000).toText()
  };

  func genCollectionId(state : State) : Text {
    state.collectionCounter += 1;
    "col-" # state.collectionCounter.toText() # "-" # (now() / 1_000_000).toText()
  };

  func canCreateAssets(ctx : CallerCtx) : Bool {
    ctx.isAdmin or (ctx.profileType == #CertificateIssuer and ctx.followerCount >= 500)
  };

  /// Add a collection ID to the owner's Set index.
  func indexCollectionForOwner(state : State, owner : Principal, colId : Text) {
    let s : Set.Set<Text> = switch (state.collectionsByOwner.get(owner)) {
      case (?existing) existing;
      case null        Set.empty<Text>();
    };
    s.add(colId);
    state.collectionsByOwner.add(owner, s);
  };

  /// Remove a collection ID from the owner's Set index.
  func deindexCollectionForOwner(state : State, owner : Principal, colId : Text) {
    switch (state.collectionsByOwner.get(owner)) {
      case null {};
      case (?s) {
        s.remove(colId);
        state.collectionsByOwner.add(owner, s);
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ASSETS
  // ═══════════════════════════════════════════════════════════════════

  /// Create a new asset. Certificate Issuers (500+ followers) or admin only.
  /// Defaults to private (privacyPublic = false).
  public func createAsset(
    state        : State,
    ctx          : CallerCtx,
    name         : Text,
    description  : ?Text,
    basePrice    : Nat,
    royaltyBps   : Nat,
    collectionId : ?Text,
    fileRefs     : [FileRef],
  ) : { #ok : Text; #err : Text } {
    if (not canCreateAssets(ctx)) {
      return #err("Only Certificate Issuers with 500+ followers (or admin) can upload assets");
    };
    if (name.isEmpty()) return #err("Asset name is required");
    if (royaltyBps > 10_000) return #err("Royalty basis points must be 0–10000");
    let id = genAssetId(state);
    let ts = now();
    state.assetsById.add(id, {
      id;
      ownerId       = ctx.caller;
      name;
      description;
      basePrice;
      royaltyBps;
      collectionId;
      privacyPublic = false;
      fileRefs;
      createdAt     = ts;
      updatedAt     = ts;
    });
    #ok id
  };

  /// Update mutable fields of an asset. Owner only (admin bypass allowed).
  public func updateAsset(
    state         : State,
    ctx           : CallerCtx,
    id            : Text,
    name          : Text,
    description   : ?Text,
    basePrice     : Nat,
    royaltyBps    : Nat,
    collectionId  : ?Text,
    privacyPublic : Bool,
    fileRefs      : [FileRef],
  ) : { #ok; #err : Text } {
    switch (state.assetsById.get(id)) {
      case null #err("Asset not found");
      case (?asset) {
        if (asset.ownerId != ctx.caller and not ctx.isAdmin) {
          return #err("Not authorized: only the owner can update this asset");
        };
        if (name.isEmpty()) return #err("Asset name is required");
        if (royaltyBps > 10_000) return #err("Royalty basis points must be 0–10000");
        state.assetsById.add(id, {
          asset with
          name;
          description;
          basePrice;
          royaltyBps;
          collectionId;
          privacyPublic;
          fileRefs;
          updatedAt = now();
        });
        #ok
      };
    }
  };

  /// Delete an asset. Owner only.
  public func deleteAsset(
    state : State,
    ctx   : CallerCtx,
    id    : Text,
  ) : { #ok; #err : Text } {
    switch (state.assetsById.get(id)) {
      case null #err("Asset not found");
      case (?asset) {
        if (asset.ownerId != ctx.caller and not ctx.isAdmin) {
          return #err("Not authorized: only the owner can delete this asset");
        };
        state.assetsById.remove(id);
        #ok
      };
    }
  };

  /// Return all assets owned by the caller — no privacy filter applied.
  public func getMyAssets(state : State, caller : Principal) : [Asset] {
    state.assetsById.values()
      .filter(func (a : Asset) : Bool { a.ownerId == caller })
      .toArray()
  };

  /// Return only privacyPublic=true assets for a given principal.
  public func getPublicAssets(state : State, owner : Principal) : [Asset] {
    state.assetsById.values()
      .filter(func (a : Asset) : Bool { a.ownerId == owner and a.privacyPublic })
      .toArray()
  };

  /// Return the asset if caller is the owner OR it is public. Returns null otherwise.
  public func getAsset(state : State, caller : Principal, id : Text) : ?Asset {
    switch (state.assetsById.get(id)) {
      case null null;
      case (?asset) {
        if (asset.ownerId == caller or asset.privacyPublic) ?asset
        else null
      };
    }
  };

  /// Store a file metadata reference on an existing asset.
  /// Called by the frontend after a platform (object-storage) file upload completes.
  public func registerFileReference(
    state   : State,
    ctx     : CallerCtx,
    assetId : Text,
    fileRef : FileRef,
  ) : { #ok; #err : Text } {
    switch (state.assetsById.get(assetId)) {
      case null #err("Asset not found");
      case (?asset) {
        if (asset.ownerId != ctx.caller and not ctx.isAdmin) {
          return #err("Not authorized: only the owner can register file references");
        };
        // Deduplicate by fileId
        let alreadyExists = asset.fileRefs.any(func (f : FileRef) : Bool { f.fileId == fileRef.fileId });
        if (alreadyExists) return #err("File reference already registered for this asset");
        state.assetsById.add(assetId, {
          asset with
          fileRefs  = asset.fileRefs.concat([fileRef]);
          updatedAt = now();
        });
        #ok
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // COLLECTIONS
  // ═══════════════════════════════════════════════════════════════════

  /// Create a new collection. Certificate Issuers (500+ followers) or admin only.
  /// Defaults to private and not for sale.
  public func createCollection(
    state       : State,
    ctx         : CallerCtx,
    name        : Text,
    description : ?Text,
  ) : { #ok : Text; #err : Text } {
    if (not canCreateAssets(ctx)) {
      return #err("Only Certificate Issuers with 500+ followers (or admin) can create collections");
    };
    if (name.isEmpty()) return #err("Collection name is required");
    let id = genCollectionId(state);
    state.collectionsById.add(id, {
      id;
      ownerId       = ctx.caller;
      name;
      description;
      privacyPublic = false;
      forSale       = false;
      salePrice     = 0;
      saleCurrency  = "ICP";
      saleMethod    = #Direct;
      createdAt     = now();
    });
    indexCollectionForOwner(state, ctx.caller, id);
    #ok id
  };

  /// Update mutable fields of a collection. Owner only.
  public func updateCollection(
    state         : State,
    ctx           : CallerCtx,
    id            : Text,
    name          : Text,
    description   : ?Text,
    privacyPublic : Bool,
    forSale       : Bool,
    salePrice     : Nat,
    saleCurrency  : Text,
    saleMethod    : SaleMethod,
  ) : { #ok; #err : Text } {
    switch (state.collectionsById.get(id)) {
      case null #err("Collection not found");
      case (?col) {
        if (col.ownerId != ctx.caller and not ctx.isAdmin) {
          return #err("Not authorized: only the owner can update this collection");
        };
        if (name.isEmpty()) return #err("Collection name is required");
        state.collectionsById.add(id, {
          col with name; description; privacyPublic; forSale; salePrice; saleCurrency; saleMethod;
        });
        #ok
      };
    }
  };

  /// Delete a collection. Owner only.
  public func deleteCollection(
    state : State,
    ctx   : CallerCtx,
    id    : Text,
  ) : { #ok; #err : Text } {
    switch (state.collectionsById.get(id)) {
      case null #err("Collection not found");
      case (?col) {
        if (col.ownerId != ctx.caller and not ctx.isAdmin) {
          return #err("Not authorized: only the owner can delete this collection");
        };
        state.collectionsById.remove(id);
        deindexCollectionForOwner(state, col.ownerId, id);
        #ok
      };
    }
  };

  /// Return all collections owned by the caller (uses collectionsByOwner index).
  public func getMyCollections(state : State, caller : Principal) : [Collection] {
    switch (state.collectionsByOwner.get(caller)) {
      case null [];
      case (?idSet) {
        idSet.values()
          .filterMap<Text, Collection>(func (cid : Text) : ?Collection {
            state.collectionsById.get(cid)
          })
          .toArray()
      };
    }
  };

  /// Return only public collections for a given principal.
  public func getPublicCollections(state : State, owner : Principal) : [Collection] {
    switch (state.collectionsByOwner.get(owner)) {
      case null [];
      case (?idSet) {
        idSet.values()
          .filterMap<Text, Collection>(func (cid : Text) : ?Collection {
            switch (state.collectionsById.get(cid)) {
              case (?col) if (col.privacyPublic) ?col else null;
              case null   null;
            }
          })
          .toArray()
      };
    }
  };

  /// Set or unset the for-sale flag along with pricing/currency/method.
  public func setCollectionForSale(
    state        : State,
    ctx          : CallerCtx,
    id           : Text,
    forSale      : Bool,
    salePrice    : Nat,
    saleCurrency : Text,
    saleMethod   : SaleMethod,
  ) : { #ok; #err : Text } {
    switch (state.collectionsById.get(id)) {
      case null #err("Collection not found");
      case (?col) {
        if (col.ownerId != ctx.caller and not ctx.isAdmin) {
          return #err("Not authorized: only the owner can set sale status");
        };
        state.collectionsById.add(id, { col with forSale; salePrice; saleCurrency; saleMethod });
        #ok
      };
    }
  };

};
