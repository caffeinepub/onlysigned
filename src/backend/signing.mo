import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

// ─── OnlySigned Signing Module ────────────────────────────────────────────────
// ICRC-7 compliant signed copies with multi-signer co-signing.
// All state uses mo:core Map and Set. No stable keyword needed.
// State is held in a State class owned by the actor.
// ─────────────────────────────────────────────────────────────────────────────

module {

  // ═══════════════════════════════════════════════════════════════════
  // TYPES
  // ═══════════════════════════════════════════════════════════════════

  public type SignerInfo = {
    principal    : Principal;
    displayName  : Text;
    certIssuerType : ?Text;   // e.g. "Celebrity", "Government", "Institution"
    signedAt     : Int;
    signature    : Text;
  };

  public type SaleMethod = { #Direct; #Auction };

  public type SignedCopy = {
    tokenId         : Nat;
    id              : Text;
    assetId         : Text;
    ownerId         : Principal;
    creatorId       : Principal;
    signers         : [SignerInfo];
    sequenceNumber  : Nat;
    price           : Nat;
    currency        : Text;
    privacyPublic   : Bool;
    certificateId   : Text;
    shareableUrl    : Text;
    authenticityHash : Text;
    createdAt       : Int;
    listedForSale   : Bool;
    saleMethod      : ?SaleMethod;
    listingPrice    : ?Nat;
    listingCurrency : ?Text;
  };

  public type CoSignInvitation = {
    id               : Text;
    signedCopyId     : Text;
    inviterPrincipal : Principal;
    inviteePrincipal : Principal;
    status           : { #Pending; #Accepted; #Declined };
    createdAt        : Int;
  };

  /// ICRC-7 metadata bag — all fields required by the standard for OnlySigned NFTs
  public type ICRC7Metadata = {
    tokenId          : Nat;
    creatorId        : Principal;
    signers          : [SignerInfo];
    assetId          : Text;
    certificateId    : Text;
    sequenceNumber   : Nat;
    authenticityHash : Text;
    shareableUrl     : Text;
  };

  public type DownloadManifest = {
    copyId           : Text;
    tokenId          : Nat;
    certificateId    : Text;
    assetId          : Text;
    sequenceNumber   : Nat;
    authenticityHash : Text;
    shareableUrl     : Text;
    signers          : [SignerInfo];
    icrc7Metadata    : ICRC7Metadata;
    generatedAt      : Int;
  };

  // ═══════════════════════════════════════════════════════════════════
  // STATE CLASS — owned by the actor, not the module
  // ═══════════════════════════════════════════════════════════════════

  public class State() {
    /// All signed copies indexed by their unique ID
    public let signedCopiesById    : Map.Map<Text, SignedCopy>        = Map.empty();
    /// Set of signed-copy IDs per asset ID
    public let signedCopiesByAsset : Map.Map<Text, Set.Set<Text>>     = Map.empty();
    /// Set of signed-copy IDs per owner principal
    public let signedCopiesByOwner : Map.Map<Principal, Set.Set<Text>> = Map.empty();
    /// Sequence counter per asset (number of copies already created)
    public let copySequenceByAsset : Map.Map<Text, Nat>               = Map.empty();
    /// Global ICRC-7 token ID counter
    public var tokenIdCounter : Nat = 0;
    /// Co-sign invitations indexed by invitation ID
    public let coSignInvitations   : Map.Map<Text, CoSignInvitation>  = Map.empty();
    /// Shareable URL → signed-copy ID mapping for fast URL lookups
    public let shareableUrlMap     : Map.Map<Text, Text>              = Map.empty();
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════════════

  func now() : Int { Time.now() };

  func nextTokenId(state : State) : Nat {
    state.tokenIdCounter += 1;
    state.tokenIdCounter
  };

  /// Compute a deterministic authenticity hash from the three most stable fields
  func computeAuthHash(assetId : Text, creatorId : Principal, tokenId : Nat) : Text {
    assetId.concat("-").concat(creatorId.toText()).concat("-").concat(tokenId.toText())
  };

  /// Build the shareable URL for a copy
  func buildShareableUrl(certificateId : Text) : Text {
    "/verify/".concat(certificateId)
  };

  /// Increment sequence for an asset and return the new sequence number
  func nextSeqForAsset(state : State, assetId : Text) : Nat {
    let current = switch (state.copySequenceByAsset.get(assetId)) {
      case (?n) n;
      case null 0;
    };
    let next = current + 1;
    state.copySequenceByAsset.add(assetId, next);
    next
  };

  /// Register a copy in the owner and asset indexes
  func indexCopy(state : State, copy : SignedCopy) {
    // By asset
    let assetSet : Set.Set<Text> = switch (state.signedCopiesByAsset.get(copy.assetId)) {
      case (?s) s;
      case null {
        let s = Set.empty<Text>();
        state.signedCopiesByAsset.add(copy.assetId, s);
        s
      };
    };
    assetSet.add(copy.id);

    // By owner
    let ownerSet : Set.Set<Text> = switch (state.signedCopiesByOwner.get(copy.ownerId)) {
      case (?s) s;
      case null {
        let s = Set.empty<Text>();
        state.signedCopiesByOwner.add(copy.ownerId, s);
        s
      };
    };
    ownerSet.add(copy.id);

    // Shareable URL mapping
    state.shareableUrlMap.add(copy.shareableUrl, copy.id);
  };

  /// Rebuild owner index when ownership changes (remove from old, add to new)
  func reindexOwner(state : State, copyId : Text, oldOwner : Principal, newOwner : Principal) {
    // Remove from old owner set
    switch (state.signedCopiesByOwner.get(oldOwner)) {
      case (?s) s.remove(copyId);
      case null {};
    };
    // Add to new owner set
    let ownerSet : Set.Set<Text> = switch (state.signedCopiesByOwner.get(newOwner)) {
      case (?s) s;
      case null {
        let s = Set.empty<Text>();
        state.signedCopiesByOwner.add(newOwner, s);
        s
      };
    };
    ownerSet.add(copyId);
  };

  func buildICRC7Metadata(copy : SignedCopy) : ICRC7Metadata {
    {
      tokenId          = copy.tokenId;
      creatorId        = copy.creatorId;
      signers          = copy.signers;
      assetId          = copy.assetId;
      certificateId    = copy.certificateId;
      sequenceNumber   = copy.sequenceNumber;
      authenticityHash = copy.authenticityHash;
      shareableUrl     = copy.shareableUrl;
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC API — SIGNING
  // ═══════════════════════════════════════════════════════════════════

  /// Sign an asset and mint it as an ICRC-7 NFT signed copy.
  /// caller must be a Certificate Issuer (500+ followers) or admin.
  /// canIssue: Bool — caller eligibility (injected by main.mo)
  /// displayName / certIssuerType: caller's profile fields for SignerInfo
  public func signAsset(
    state          : State,
    caller         : Principal,
    assetId        : Text,
    price          : Nat,
    currency       : Text,
    canIssue       : Bool,
    displayName    : Text,
    certIssuerType : ?Text,
    mkId           : (Text, Nat) -> Text,    // ID generator from main.mo
    seqCounter     : () -> Nat,              // global copy seq from main.mo
  ) : { #ok : SignedCopy; #err : Text } {
    if (not canIssue) return #err("Need 500+ followers or admin status to issue certificates");

    let tokenId       = nextTokenId(state);
    let seqNum        = nextSeqForAsset(state, assetId);
    let seq           = seqCounter();
    let copyId        = mkId("copy", seq);
    let certId        = "cert-".concat(copyId);
    let hash          = computeAuthHash(assetId, caller, tokenId);
    let url           = buildShareableUrl(certId);
    let signerInfo : SignerInfo = {
      principal      = caller;
      displayName;
      certIssuerType;
      signedAt       = now();
      signature      = hash;
    };

    let copy : SignedCopy = {
      tokenId;
      id              = copyId;
      assetId;
      ownerId         = caller;
      creatorId       = caller;
      signers         = [signerInfo];
      sequenceNumber  = seqNum;
      price;
      currency;
      privacyPublic   = false;
      certificateId   = certId;
      shareableUrl    = url;
      authenticityHash = hash;
      createdAt       = now();
      listedForSale   = false;
      saleMethod      = null;
      listingPrice    = null;
      listingCurrency = null;
    };

    state.signedCopiesById.add(copy.id, copy);
    indexCopy(state, copy);
    #ok copy
  };

  /// Toggle privacy on a signed copy. Only the current owner may do this.
  public func setSignedCopyPrivacy(
    state     : State,
    caller    : Principal,
    copyId    : Text,
    isPublic  : Bool,
    adminCheck : Bool,
  ) : { #ok; #err : Text } {
    switch (state.signedCopiesById.get(copyId)) {
      case null #err("Signed copy not found");
      case (?sc) {
        if (sc.ownerId != caller and not adminCheck)
          return #err("Not authorized");
        state.signedCopiesById.add(copyId, { sc with privacyPublic = isPublic });
        #ok
      };
    }
  };

  /// Get a signed copy respecting privacy: returns if caller is owner or copy is public.
  public func getSignedCopy(state : State, caller : Principal, copyId : Text) : ?SignedCopy {
    switch (state.signedCopiesById.get(copyId)) {
      case null null;
      case (?sc) {
        if (sc.ownerId == caller or sc.privacyPublic) ?sc else null
      };
    }
  };

  /// All copies owned by the caller.
  public func getMySignedCopies(state : State, caller : Principal) : [SignedCopy] {
    switch (state.signedCopiesByOwner.get(caller)) {
      case null [];
      case (?ids) {
        ids.values()
          .filterMap(func (id : Text) : ?SignedCopy { state.signedCopiesById.get(id) })
          .toArray()
      };
    }
  };

  /// All copies for an asset, respecting privacy (caller sees own private copies).
  public func getSignedCopiesForAsset(state : State, caller : Principal, assetId : Text) : [SignedCopy] {
    switch (state.signedCopiesByAsset.get(assetId)) {
      case null [];
      case (?ids) {
        ids.values()
          .filterMap(func (id : Text) : ?SignedCopy {
            switch (state.signedCopiesById.get(id)) {
              case null null;
              case (?sc) {
                if (sc.ownerId == caller or sc.privacyPublic) ?sc else null
              };
            }
          })
          .toArray()
      };
    }
  };

  /// Public copies for a given principal (for public profiles).
  public func getPublicSignedCopies(state : State, principal : Principal) : [SignedCopy] {
    switch (state.signedCopiesByOwner.get(principal)) {
      case null [];
      case (?ids) {
        ids.values()
          .filterMap(func (id : Text) : ?SignedCopy {
            switch (state.signedCopiesById.get(id)) {
              case null null;
              case (?sc) if (sc.privacyPublic) ?sc else null;
            }
          })
          .toArray()
      };
    }
  };

  /// Look up a signed copy by its shareable URL (public endpoint).
  public func getSignedCopyByUrl(state : State, url : Text) : ?SignedCopy {
    switch (state.shareableUrlMap.get(url)) {
      case null null;
      case (?id) state.signedCopiesById.get(id);
    }
  };

  /// Validate a certificate by certificateId OR shareableUrl.
  /// Returns the full SignedCopy with all signers and ICRC-7 metadata.
  public func validateCertificate(state : State, certIdOrUrl : Text) : ?SignedCopy {
    // Try as certificateId first
    let byId = state.signedCopiesById.values()
      .find(func (sc : SignedCopy) : Bool { sc.certificateId == certIdOrUrl });
    switch byId {
      case (?sc) return ?sc;
      case null {};
    };
    // Fall back to URL lookup
    getSignedCopyByUrl(state, certIdOrUrl)
  };

  // ═══════════════════════════════════════════════════════════════════
  // CO-SIGNING
  // ═══════════════════════════════════════════════════════════════════

  /// Invite another user to co-sign a signed copy.
  /// Only the current owner can invite. Invited user is exempt from follower requirement.
  public func inviteCoSigner(
    state        : State,
    caller       : Principal,
    signedCopyId : Text,
    invitee      : Principal,
    mkId         : (Text, Nat) -> Text,
    seqCounter   : () -> Nat,
  ) : { #ok : Text; #err : Text } {
    switch (state.signedCopiesById.get(signedCopyId)) {
      case null #err("Signed copy not found");
      case (?sc) {
        if (sc.ownerId != caller) return #err("Only the owner can invite co-signers");
        if (caller == invitee) return #err("Cannot invite yourself");
        let alreadySigner = sc.signers.any(func (s : SignerInfo) : Bool {
          s.principal == invitee
        });
        if (alreadySigner) return #err("User is already a signer");
        // Check for existing pending invitation
        let existingPending = state.coSignInvitations.values().any(
          func (inv : CoSignInvitation) : Bool {
            inv.signedCopyId == signedCopyId and
            inv.inviteePrincipal == invitee and
            inv.status == #Pending
          }
        );
        if (existingPending) return #err("Pending invitation already exists for this user");

        let id = mkId("inv", seqCounter());
        state.coSignInvitations.add(id, {
          id;
          signedCopyId;
          inviterPrincipal = caller;
          inviteePrincipal = invitee;
          status           = #Pending;
          createdAt        = now();
        });
        #ok id
      };
    }
  };

  /// Accept a co-sign invitation. Adds the invitee as a signer to the SignedCopy.
  /// Invited users do NOT need Certificate Issuer eligibility.
  public func acceptCoSignInvitation(
    state        : State,
    caller       : Principal,
    invitationId : Text,
    displayName  : Text,
    certIssuerType : ?Text,
  ) : { #ok; #err : Text } {
    switch (state.coSignInvitations.get(invitationId)) {
      case null #err("Invitation not found");
      case (?inv) {
        if (inv.inviteePrincipal != caller) return #err("Not your invitation");
        if (inv.status != #Pending) return #err("Invitation is not pending");
        switch (state.signedCopiesById.get(inv.signedCopyId)) {
          case null #err("Signed copy no longer exists");
          case (?sc) {
            let signature = "cosig-".concat(caller.toText()).concat("-").concat(invitationId);
            let newSigner : SignerInfo = {
              principal      = caller;
              displayName;
              certIssuerType;
              signedAt       = now();
              signature;
            };
            let updatedCopy = { sc with signers = sc.signers.concat([newSigner]) };
            state.signedCopiesById.add(inv.signedCopyId, updatedCopy);
            state.coSignInvitations.add(invitationId, { inv with status = #Accepted });
            #ok
          };
        }
      };
    }
  };

  /// Decline a co-sign invitation.
  public func declineCoSignInvitation(state : State, caller : Principal, invitationId : Text) : { #ok; #err : Text } {
    switch (state.coSignInvitations.get(invitationId)) {
      case null #err("Invitation not found");
      case (?inv) {
        if (inv.inviteePrincipal != caller) return #err("Not your invitation");
        if (inv.status != #Pending) return #err("Invitation is not pending");
        state.coSignInvitations.add(invitationId, { inv with status = #Declined });
        #ok
      };
    }
  };

  /// All pending co-sign invitations where the caller is the invitee.
  public func getMyCoSignInvitations(state : State, caller : Principal) : [CoSignInvitation] {
    state.coSignInvitations.values()
      .filter(func (inv : CoSignInvitation) : Bool {
        inv.inviteePrincipal == caller and inv.status == #Pending
      })
      .toArray()
  };

  // ═══════════════════════════════════════════════════════════════════
  // DOWNLOAD PACKAGE
  // ═══════════════════════════════════════════════════════════════════

  /// Generate a download manifest for a signed copy.
  /// Caller must be the current owner. Returns all signer info, asset hash,
  /// ICRC-7 metadata, and certificateId for client-side package assembly.
  public func generateDownloadPackage(
    state  : State,
    caller : Principal,
    copyId : Text,
  ) : { #ok : DownloadManifest; #err : Text } {
    switch (state.signedCopiesById.get(copyId)) {
      case null #err("Signed copy not found");
      case (?sc) {
        if (sc.ownerId != caller) return #err("You do not own this signed copy");
        let manifest : DownloadManifest = {
          copyId           = sc.id;
          tokenId          = sc.tokenId;
          certificateId    = sc.certificateId;
          assetId          = sc.assetId;
          sequenceNumber   = sc.sequenceNumber;
          authenticityHash = sc.authenticityHash;
          shareableUrl     = sc.shareableUrl;
          signers          = sc.signers;
          icrc7Metadata    = buildICRC7Metadata(sc);
          generatedAt      = now();
        };
        #ok manifest
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // OWNERSHIP TRANSFER (used by marketplace)
  // ═══════════════════════════════════════════════════════════════════

  /// Transfer ownership of a signed copy to a new owner.
  /// Used by marketplace after a successful purchase.
  public func transferOwnership(state : State, copyId : Text, newOwner : Principal) : { #ok; #err : Text } {
    switch (state.signedCopiesById.get(copyId)) {
      case null #err("Signed copy not found");
      case (?sc) {
        let oldOwner = sc.ownerId;
        state.signedCopiesById.add(copyId, { sc with ownerId = newOwner });
        reindexOwner(state, copyId, oldOwner, newOwner);
        #ok
      };
    }
  };

  /// Update listing state on a signed copy (used by marketplace listing/delisting).
  public func setListingState(
    state           : State,
    copyId          : Text,
    listedForSale   : Bool,
    saleMethod      : ?SaleMethod,
    listingPrice    : ?Nat,
    listingCurrency : ?Text,
  ) : { #ok; #err : Text } {
    switch (state.signedCopiesById.get(copyId)) {
      case null #err("Signed copy not found");
      case (?sc) {
        state.signedCopiesById.add(copyId, {
          sc with listedForSale; saleMethod; listingPrice; listingCurrency
        });
        #ok
      };
    }
  };

  /// Size helper used by admin stats
  public func size(state : State) : Nat {
    state.signedCopiesById.size()
  };

}
