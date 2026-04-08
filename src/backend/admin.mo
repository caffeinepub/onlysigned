import Time "mo:core/Time";

// ─── OnlySigned Admin Module ──────────────────────────────────────────────────
// Supplemental admin types and helper functions.
// All admin state lives in main.mo (single persistent actor).
// This module exports shared types used by main.mo and provides
// stateless helper functions for admin operations.
// ─────────────────────────────────────────────────────────────────────────────

module {

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN-SPECIFIC TYPES
  // ═══════════════════════════════════════════════════════════════════

  /// Transfer history entry for a UsernameNFT
  public type TransferRecord = {
    from : Principal;
    to   : Principal;
    at   : Int;
  };

  /// A minted username NFT owned by a principal
  public type UsernameNFT = {
    id              : Text;       // "unft-<username>"
    username        : Text;
    ownerPrincipal  : Principal;  // current owner
    mintedBy        : Principal;
    mintedAt        : Int;
    transferHistory : [TransferRecord];
  };

  /// A purchase offer submitted by a user for a username NFT
  public type UsernameOffer = {
    id               : Text;
    offererPrincipal : Principal;
    targetUsername   : Text;
    amount           : Nat;
    currency         : Text;      // "ICP" | "ckBTC" | "ckUSDC" | "ckUSDT"
    submittedAt      : Int;
    status           : OfferStatus;
    nftExists        : Bool;      // true if the username NFT already exists
  };

  public type OfferStatus = { #Pending; #Accepted; #Rejected };

  /// A support form submission from a user
  public type SupportSubmission = {
    id                 : Text;
    submitterPrincipal : ?Principal;
    subject            : Text;
    message            : Text;
    email              : ?Text;
    submittedAt        : Int;
    status             : SubmissionStatus;
  };

  public type SubmissionStatus = { #Pending; #Reviewed };

  /// Admin statistics snapshot
  public type AdminStats = {
    totalUsers            : Nat;
    activeUsersLast30Days : Nat;
    totalAssets           : Nat;
    totalSignedCopies     : Nat;
    totalTransactions     : Nat;
    totalMarketplaceVolume : Nat;
  };

  /// Canister ID detection result
  public type CanisterIdResult = {
    canisterId      : Text;
    detectionMethod : Text;
  };

  // ═══════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════

  /// Build a canister ID result record from a known ID and detection method.
  public func makeCanisterIdResult(id : Text, method : Text) : CanisterIdResult {
    { canisterId = id; detectionMethod = method }
  };

  /// Convert an offer status variant to a display string.
  public func offerStatusText(s : OfferStatus) : Text {
    switch s {
      case (#Pending)  "Pending";
      case (#Accepted) "Accepted";
      case (#Rejected) "Rejected";
    }
  };

  /// Convert a submission status variant to a display string.
  public func submissionStatusText(s : SubmissionStatus) : Text {
    switch s {
      case (#Pending)  "Pending";
      case (#Reviewed) "Reviewed";
    }
  };

  /// Return true if a timestamp is within the last 30 days (nanoseconds).
  public func isWithinLast30Days(ts : Int) : Bool {
    let now = Time.now();
    let thirtyDaysNs : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    (now - ts) <= thirtyDaysNs
  };

};
