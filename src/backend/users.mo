import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

// ─── Users Domain Module ──────────────────────────────────────────────────────
// Stateless module — all state is passed in by the actor.
// Covers: registration, profile management, following, admin reclaim.
// ─────────────────────────────────────────────────────────────────────────────

module {

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC TYPES
  // ═══════════════════════════════════════════════════════════════════

  public type ProfileType   = { #Collector; #CertificateIssuer };
  public type IssuerSubtype = { #Celebrity; #Government; #Institution };

  public type User = {
    id             : Principal;
    userNumber     : Nat;
    isAdmin        : Bool;
    username       : ?Text;
    displayName    : Text;
    bio            : Text;
    profileType    : ProfileType;
    certIssuerSubtype : ?IssuerSubtype;
    birthdate      : ?Text;
    email          : ?Text;
    profilePhoto   : ?Text;
    personalUrl    : ?Text;
    isVerified     : Bool;
    followerCount  : Nat;
    followingCount : Nat;
    registrationTime : Int;
    lastActiveTime : Int;
    hasUsernameNFT : Bool;
  };

  // Shared-safe update params (no mutable fields)
  public type UpdateProfileArgs = {
    displayName       : Text;
    bio               : Text;
    profileType       : ProfileType;
    certIssuerSubtype : ?IssuerSubtype;
    birthdate         : ?Text;
    email             : ?Text;
    profilePhoto      : ?Text;
    personalUrl       : ?Text;
  };

  public type SearchFilter = {
    searchText    : Text;
    onlyVerified  : Bool;
    onlyAdmin     : Bool;
    profileType   : ?ProfileType;
    subtype       : ?IssuerSubtype;
    minFollowers  : ?Nat;
    sortBy        : { #UserNumber; #RegistrationTime; #LastActive; #FollowerCount };
  };

  // ═══════════════════════════════════════════════════════════════════
  // STATE TYPES — passed in from actor
  // ═══════════════════════════════════════════════════════════════════

  public type UsersMap       = Map.Map<Principal, User>;
  public type FollowMap      = Map.Map<Principal, Set.Set<Principal>>;

  // ═══════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════

  func now() : Int { Time.now() };

  func touchUser(users : UsersMap, caller : Principal) {
    switch (users.get(caller)) {
      case (?u) users.add(caller, { u with lastActiveTime = now() });
      case null {};
    };
  };

  /// Count principals in a Set<Principal>
  func setSize(s : Set.Set<Principal>) : Nat { s.size() };

  /// Rebuild follower/following counts for a principal from the follow maps
  func refreshCounts(
    users     : UsersMap,
    followMap : FollowMap,
    followersMap : FollowMap,
    principal : Principal,
  ) {
    switch (users.get(principal)) {
      case (?u) {
        let frs = switch (followersMap.get(principal)) {
          case (?s) setSize(s);
          case null 0;
        };
        let fng = switch (followMap.get(principal)) {
          case (?s) setSize(s);
          case null 0;
        };
        users.add(principal, {
          u with
          followerCount  = frs;
          followingCount = fng;
          lastActiveTime = now();
        });
      };
      case null {};
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // REGISTRATION
  // ═══════════════════════════════════════════════════════════════════

  /// Register a new user. Returns the assigned userNumber on success.
  /// First user (userCount == 0 before increment) gets isAdmin = true.
  /// All subsequent users get isAdmin = false.
  /// displayName must be unique across all principals.
  public func registerUser(
    users     : UsersMap,
    userCount : Nat,           // current count; caller increments after
    caller    : Principal,
    displayName : Text,
  ) : { #ok : Nat; #err : Text } {
    if (caller.isAnonymous()) return #err("Must be logged in");
    if (displayName.isEmpty()) return #err("Display name is required");

    // Uniqueness check: no other principal can have the same displayName
    let taken = users.values().any(func (u : User) : Bool {
      not Principal.equal(u.id, caller) and u.displayName == displayName
    });
    if (taken) return #err("Display name already taken");

    switch (users.get(caller)) {
      case (?_existing) #err("Already registered");
      case null {
        let num  = userCount;        // assigned number
        let isAdminUser = num == 0;  // first registered user is always admin
        let user : User = {
          id               = caller;
          userNumber       = num;
          isAdmin          = isAdminUser;
          username         = null;
          displayName;
          bio              = "";
          profileType      = #Collector;
          certIssuerSubtype = null;
          birthdate        = null;
          email            = null;
          profilePhoto     = null;
          personalUrl      = null;
          isVerified       = false;
          followerCount    = 0;
          followingCount   = 0;
          registrationTime = now();
          lastActiveTime   = now();
          hasUsernameNFT   = false;
        };
        users.add(caller, user);
        #ok num
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // PROFILE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  /// Update mutable profile fields. Enforces displayName uniqueness.
  /// Username can only be set if hasUsernameNFT == true.
  public func updateProfile(
    users   : UsersMap,
    caller  : Principal,
    args    : UpdateProfileArgs,
  ) : { #ok; #err : Text } {
    if (caller.isAnonymous()) return #err("Must be logged in");
    switch (users.get(caller)) {
      case null #err("Profile not found. Please register first.");
      case (?u) {
        // displayName uniqueness
        let taken = users.values().any(func (p : User) : Bool {
          not Principal.equal(p.id, caller) and p.displayName == args.displayName
        });
        if (taken) return #err("Display name already taken");
        users.add(caller, {
          u with
          displayName       = args.displayName;
          bio               = args.bio;
          profileType       = args.profileType;
          certIssuerSubtype = args.certIssuerSubtype;
          birthdate         = args.birthdate;
          email             = args.email;
          profilePhoto      = args.profilePhoto;
          personalUrl       = args.personalUrl;
          lastActiveTime    = now();
        });
        #ok
      };
    }
  };

  /// Set username. Caller must have hasUsernameNFT == true and own the NFT.
  /// Sets isVerified = true on success.
  public func setUsername(
    users    : UsersMap,
    caller   : Principal,
    username : Text,
  ) : { #ok; #err : Text } {
    if (caller.isAnonymous()) return #err("Must be logged in");
    switch (users.get(caller)) {
      case null #err("Profile not found");
      case (?u) {
        if (not u.hasUsernameNFT) return #err("You do not own a UsernameNFT");
        // Check username uniqueness across all users
        let taken = users.values().any(func (p : User) : Bool {
          not Principal.equal(p.id, caller) and
          (switch (p.username) { case (?n) n == username; case null false })
        });
        if (taken) return #err("Username already taken");
        users.add(caller, {
          u with
          username       = ?username;
          isVerified     = true;
          lastActiveTime = now();
        });
        #ok
      };
    }
  };

  /// Grant hasUsernameNFT to a user (called by admin after minting).
  public func grantUsernameNFT(
    users    : UsersMap,
    principal : Principal,
  ) {
    switch (users.get(principal)) {
      case (?u) users.add(principal, { u with hasUsernameNFT = true; isVerified = true });
      case null {};
    };
  };

  /// Revoke hasUsernameNFT from a user (called on transfer away).
  public func revokeUsernameNFT(
    users    : UsersMap,
    principal : Principal,
  ) {
    switch (users.get(principal)) {
      case (?u) users.add(principal, { u with hasUsernameNFT = false });
      case null {};
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // PROFILE QUERIES
  // ═══════════════════════════════════════════════════════════════════

  public func getMyProfile(users : UsersMap, caller : Principal) : ?User {
    switch (users.get(caller)) {
      case null null;
      case (?u) {
        // Safety net: userNumber 0 always admin
        if (u.userNumber == 0 and not u.isAdmin) {
          users.add(caller, { u with isAdmin = true });
          ?{ u with isAdmin = true }
        } else {
          ?u
        }
      };
    }
  };

  public func getUserByPrincipal(users : UsersMap, principal : Principal) : ?User {
    users.get(principal)
  };

  public func getUserByNumber(users : UsersMap, n : Nat) : ?User {
    users.values().find(func (u : User) : Bool { u.userNumber == n })
  };

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════

  public func searchUsers(users : UsersMap, filter : SearchFilter, limit : Nat) : [User] {
    let q = filter.searchText.toLower();
    let matched = users.values().filter(func (u : User) : Bool {
      // text match
      let textMatch =
        q == "" or
        u.displayName.toLower().contains(#text q) or
        u.userNumber.toText().contains(#text q) or
        (switch (u.username) { case (?name) name.toLower().contains(#text q); case null false });

      // flag filters
      let verifiedMatch  = not filter.onlyVerified or u.isVerified;
      let adminMatch     = not filter.onlyAdmin    or u.isAdmin;

      // profileType filter
      let typeMatch = switch (filter.profileType) {
        case null true;
        case (?pt) u.profileType == pt;
      };

      // subtype filter
      let subtypeMatch = switch (filter.subtype) {
        case null true;
        case (?st) switch (u.certIssuerSubtype) { case (?s) s == st; case null false };
      };

      // minimum followers filter
      let followersMatch = switch (filter.minFollowers) {
        case null true;
        case (?min) u.followerCount >= min;
      };

      textMatch and verifiedMatch and adminMatch and typeMatch and subtypeMatch and followersMatch
    });

    // Sort
    let arr = matched.toArray();
    let sorted = arr.sort(func (a : User, b : User) : Order.Order {
      switch (filter.sortBy) {
        case (#UserNumber)       Nat.compare(a.userNumber, b.userNumber);
        case (#RegistrationTime) Int.compare(a.registrationTime, b.registrationTime);
        case (#LastActive)       Int.compare(b.lastActiveTime, a.lastActiveTime); // desc
        case (#FollowerCount)    Nat.compare(b.followerCount, a.followerCount);   // desc
      }
    });

    sorted.sliceToArray(0, Nat.min(limit, sorted.size()))
  };

  public func getLatestActiveUsers(users : UsersMap, limit : Nat) : [User] {
    let arr = users.values().toArray();
    let sorted = arr.sort(func (a : User, b : User) : Order.Order {
      Int.compare(b.lastActiveTime, a.lastActiveTime)  // desc
    });
    sorted.sliceToArray(0, Nat.min(limit, sorted.size()))
  };

  // ═══════════════════════════════════════════════════════════════════
  // FOLLOWING
  // ═══════════════════════════════════════════════════════════════════

  /// Follow a user. Updates followMap, followersMap and refreshes counts.
  public func followUser(
    users        : UsersMap,
    followMap    : FollowMap,    // follower -> Set<following>
    followersMap : FollowMap,    // following -> Set<followers>
    caller       : Principal,
    target       : Principal,
  ) : { #ok; #err : Text } {
    if (caller.isAnonymous()) return #err("Must be logged in");
    if (Principal.equal(caller, target)) return #err("Cannot follow yourself");

    // Get or init the caller's following set
    let callerSet : Set.Set<Principal> = switch (followMap.get(caller)) {
      case (?s) s;
      case null {
        let s = Set.empty<Principal>();
        followMap.add(caller, s);
        s
      };
    };
    if (callerSet.contains(target)) return #err("Already following");
    callerSet.add(target);
    followMap.add(caller, callerSet);

    // Get or init target's followers set
    let targetSet : Set.Set<Principal> = switch (followersMap.get(target)) {
      case (?s) s;
      case null {
        let s = Set.empty<Principal>();
        followersMap.add(target, s);
        s
      };
    };
    targetSet.add(caller);
    followersMap.add(target, targetSet);

    refreshCounts(users, followMap, followersMap, caller);
    refreshCounts(users, followMap, followersMap, target);
    touchUser(users, caller);
    #ok
  };

  /// Unfollow a user.
  public func unfollowUser(
    users        : UsersMap,
    followMap    : FollowMap,
    followersMap : FollowMap,
    caller       : Principal,
    target       : Principal,
  ) : { #ok; #err : Text } {
    if (caller.isAnonymous()) return #err("Must be logged in");
    switch (followMap.get(caller)) {
      case null return #err("Not following");
      case (?callerSet) {
        if (not callerSet.contains(target)) return #err("Not following");
        callerSet.remove(target);
        // Remove from target's followers
        switch (followersMap.get(target)) {
          case (?targetSet) targetSet.remove(caller);
          case null {};
        };
        refreshCounts(users, followMap, followersMap, caller);
        refreshCounts(users, followMap, followersMap, target);
        touchUser(users, caller);
        #ok
      };
    }
  };

  public func getFollowers(followersMap : FollowMap, principal : Principal) : [Principal] {
    switch (followersMap.get(principal)) {
      case (?s) s.toArray();
      case null [];
    }
  };

  public func getFollowing(followMap : FollowMap, principal : Principal) : [Principal] {
    switch (followMap.get(principal)) {
      case (?s) s.toArray();
      case null [];
    }
  };

  public func checkIsFollowing(followMap : FollowMap, caller : Principal, target : Principal) : Bool {
    switch (followMap.get(caller)) {
      case (?s) s.contains(target);
      case null false;
    }
  };

  // Paginated helpers (offset/limit)
  public func getFollowersPaged(
    followersMap  : FollowMap,
    principal     : Principal,
    offset        : Nat,
    limit         : Nat,
  ) : [Principal] {
    switch (followersMap.get(principal)) {
      case null [];
      case (?s) {
        let arr = s.toArray();
        arr.sliceToArray(Int.fromNat(offset), Int.fromNat(Nat.min(offset + limit, arr.size())))
      };
    }
  };

  public func getFollowingPaged(
    followMap : FollowMap,
    principal : Principal,
    offset    : Nat,
    limit     : Nat,
  ) : [Principal] {
    switch (followMap.get(principal)) {
      case null [];
      case (?s) {
        let arr = s.toArray();
        arr.sliceToArray(Int.fromNat(offset), Int.fromNat(Nat.min(offset + limit, arr.size())))
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════════

  /// Returns true if the principal is a registered admin.
  public func isAdmin(users : UsersMap, caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (?u) u.isAdmin or u.userNumber == 0;
      case null false;
    }
  };

  /// Reassign admin to caller.
  /// Succeeds if: (a) caller is already admin, OR (b) no admin currently exists.
  /// Demotes all other existing admins.
  public func reclaimAdmin(users : UsersMap, caller : Principal) : { #ok; #err : Text } {
    if (caller.isAnonymous()) return #err("Must be logged in");
    switch (users.get(caller)) {
      case null return #err("Profile not found. Please register first.");
      case (?callerUser) {
        // Check if any admin exists (other than caller)
        let existingAdmin = users.values().find(func (u : User) : Bool {
          u.isAdmin and not Principal.equal(u.id, caller)
        });

        // Only allow if caller is admin OR no admin exists
        let callerIsAdmin = callerUser.isAdmin or callerUser.userNumber == 0;
        let noAdminExists = switch existingAdmin { case null true; case (?_) false };

        if (not callerIsAdmin and not noAdminExists) {
          return #err("Unauthorized: only existing admin can reclaim, or call when no admin exists");
        };

        // Demote all other admins
        let toUpdate = List.empty<Principal>();
        for ((p, u) in users.entries()) {
          if (u.isAdmin and not Principal.equal(p, caller)) {
            toUpdate.add(p);
          };
        };
        for (p in toUpdate.values()) {
          switch (users.get(p)) {
            case (?u) users.add(p, { u with isAdmin = false });
            case null {};
          };
        };

        // Set caller as admin
        users.add(caller, { callerUser with isAdmin = true; lastActiveTime = now() });
        #ok
      };
    }
  };

  /// Admin-only: set another user's admin status.
  public func setUserAdmin(
    users      : UsersMap,
    caller     : Principal,
    target     : Principal,
    adminValue : Bool,
  ) : { #ok; #err : Text } {
    if (not isAdmin(users, caller)) return #err("Unauthorized: admin only");
    switch (users.get(target)) {
      case null #err("User not found");
      case (?u) {
        users.add(target, { u with isAdmin = adminValue });
        #ok
      };
    }
  };

  /// Admin-only: set certificate issuer status.
  public func setCertificateIssuerStatus(
    users     : UsersMap,
    caller    : Principal,
    target    : Principal,
    isIssuer  : Bool,
    subtype   : ?IssuerSubtype,
  ) : { #ok; #err : Text } {
    if (not isAdmin(users, caller)) return #err("Unauthorized: admin only");
    switch (users.get(target)) {
      case null #err("User not found");
      case (?u) {
        let profileType : ProfileType = if isIssuer #CertificateIssuer else #Collector;
        users.add(target, {
          u with
          profileType       = profileType;
          certIssuerSubtype = if isIssuer subtype else null;
        });
        #ok
      };
    }
  };

  /// Check if user can issue certificates (CertificateIssuer with 500+ followers or admin).
  public func canIssueCerts(users : UsersMap, caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (?u) u.isAdmin or u.userNumber == 0 or
                (u.profileType == #CertificateIssuer and u.followerCount >= 500);
      case null false;
    }
  };

  // Touch last active time — for use from other domains
  public func touch(users : UsersMap, caller : Principal) {
    touchUser(users, caller);
  };

}
