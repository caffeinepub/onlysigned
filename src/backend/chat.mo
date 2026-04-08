import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

// ─── Chat Domain Module ───────────────────────────────────────────────────────
// Handles: contact invitations, mutual contacts, private messaging,
//          private asset sharing, signed copy download manifests, support form,
//          and domain verification.
//
// All state maps are declared here and intended to be included in the actor
// that imports this module. Functions receive state slices via parameters.
// ─────────────────────────────────────────────────────────────────────────────

module {

  // ═══════════════════════════════════════════════════════════════════
  // TYPES
  // ═══════════════════════════════════════════════════════════════════

  public type InvitationStatus = { #Pending; #Accepted; #Declined };

  public type ContactInvitation = {
    id          : Text;
    fromPrincipal : Principal;
    toPrincipal   : Principal;
    status      : InvitationStatus;
    createdAt   : Int;
  };

  public type Message = {
    id            : Text;
    fromPrincipal : Principal;
    toPrincipal   : Principal;
    content       : Text;
    sentAt        : Int;
    readAt        : ?Int;
  };

  public type AssetShare = {
    assetId              : Text;
    ownerPrincipal       : Principal;
    sharedWithPrincipal  : Principal;
    sharedAt             : Int;
    revoked              : Bool;
  };

  public type FileRef = {
    path     : Text;
    fileType : Text;
    hash     : Text;
  };

  public type SignerInfo = {
    principal : Principal;
    signedAt  : Int;
    signature : Text;
  };

  public type Icrc7Metadata = {
    tokenId          : Nat;
    certificateId    : Text;
    assetId          : Text;
    authenticityHash : Text;
    creatorPrincipal : Text;
    allSigners       : [SignerInfo];
    sequenceNumber   : Nat;
  };

  public type DownloadManifest = {
    signedCopyId  : Text;
    certificateId : Text;
    tokenId       : Nat;
    assetName     : Text;
    fileRefs      : [FileRef];
    allSigners    : [SignerInfo];
    icrc7Metadata : Icrc7Metadata;
    downloadedAt  : Int;
  };

  public type SupportSubmission = {
    id           : Text;
    subject      : Text;
    message      : Text;
    contactEmail : ?Text;
    submittedBy  : ?Principal;
    createdAt    : Int;
  };

  // ═══════════════════════════════════════════════════════════════════
  // STATE CONSTRUCTORS
  // Call these in the actor to initialise each state map.
  // ═══════════════════════════════════════════════════════════════════

  public func newInvitations() : Map.Map<Text, ContactInvitation> {
    Map.empty<Text, ContactInvitation>()
  };

  public func newContacts() : Map.Map<Principal, Set.Set<Principal>> {
    Map.empty<Principal, Set.Set<Principal>>()
  };

  public func newMessages() : Map.Map<Text, Message> {
    Map.empty<Text, Message>()
  };

  public func newMessagesByPair() : Map.Map<Text, [Text]> {
    Map.empty<Text, [Text]>()
  };

  public func newAssetShares() : Map.Map<Text, AssetShare> {
    Map.empty<Text, AssetShare>()
  };

  public func newSupportSubmissions() : Map.Map<Text, SupportSubmission> {
    Map.empty<Text, SupportSubmission>()
  };

  // ═══════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════

  /// Deterministic pair key: smaller principal text first.
  public func pairKey(a : Principal, b : Principal) : Text {
    let ta = a.toText();
    let tb = b.toText();
    if (ta.less(tb)) ta # ":" # tb else tb # ":" # ta
  };

  public func invitationKey(from : Principal, to : Principal) : Text {
    from.toText() # "->" # to.toText()
  };

  public func shareKey(assetId : Text, sharedWith : Principal) : Text {
    assetId # ":" # sharedWith.toText()
  };

  func areMutualContacts(
    contacts : Map.Map<Principal, Set.Set<Principal>>,
    a : Principal,
    b : Principal,
  ) : Bool {
    let aContainsB = switch (contacts.get(a)) {
      case (?s) s.contains(b);
      case null false;
    };
    let bContainsA = switch (contacts.get(b)) {
      case (?s) s.contains(a);
      case null false;
    };
    aContainsB and bContainsA
  };

  func addContact(
    contacts : Map.Map<Principal, Set.Set<Principal>>,
    owner : Principal,
    contact : Principal,
  ) {
    let s : Set.Set<Principal> = switch (contacts.get(owner)) {
      case (?existing) existing;
      case null {
        let fresh = Set.empty<Principal>();
        contacts.add(owner, fresh);
        fresh
      };
    };
    s.add(contact);
  };

  // ═══════════════════════════════════════════════════════════════════
  // CONTACT INVITATIONS
  // ═══════════════════════════════════════════════════════════════════

  /// Send a contact invitation from `caller` to `to`.
  /// Returns #err if they are already contacts or a pending invitation exists.
  public func sendContactInvitation(
    caller      : Principal,
    to          : Principal,
    invitations : Map.Map<Text, ContactInvitation>,
    contacts    : Map.Map<Principal, Set.Set<Principal>>,
    mkId        : (Text, Nat) -> Text,
    seq         : Nat,
  ) : { #ok : Text; #err : Text } {
    if (caller == to) return #err("Cannot invite yourself");
    if (areMutualContacts(contacts, caller, to))
      return #err("Already mutual contacts");
    let key = invitationKey(caller, to);
    switch (invitations.get(key)) {
      case (?inv) {
        if (inv.status == #Pending) return #err("Invitation already pending");
        if (inv.status == #Accepted) return #err("Already contacts");
      };
      case null {};
    };
    let id = mkId("cinv", seq);
    invitations.add(key, {
      id;
      fromPrincipal = caller;
      toPrincipal   = to;
      status        = #Pending;
      createdAt     = Time.now();
    });
    #ok id
  };

  /// Accept a pending invitation from `from` to `caller`.
  /// Adds mutual contact relationship in contacts Map for both parties.
  public func acceptContactInvitation(
    caller      : Principal,
    from        : Principal,
    invitations : Map.Map<Text, ContactInvitation>,
    contacts    : Map.Map<Principal, Set.Set<Principal>>,
  ) : { #ok; #err : Text } {
    let key = invitationKey(from, caller);
    switch (invitations.get(key)) {
      case null return #err("Invitation not found");
      case (?inv) {
        if (inv.status != #Pending) return #err("Invitation is not pending");
        invitations.add(key, { inv with status = #Accepted });
        addContact(contacts, caller, from);
        addContact(contacts, from, caller);
        #ok
      };
    }
  };

  /// Decline a pending invitation from `from` to `caller`.
  public func declineContactInvitation(
    caller      : Principal,
    from        : Principal,
    invitations : Map.Map<Text, ContactInvitation>,
  ) : { #ok; #err : Text } {
    let key = invitationKey(from, caller);
    switch (invitations.get(key)) {
      case null return #err("Invitation not found");
      case (?inv) {
        if (inv.status != #Pending) return #err("Invitation is not pending");
        invitations.add(key, { inv with status = #Declined });
        #ok
      };
    }
  };

  /// Return all mutual contacts for `caller` as an array of Principals.
  public func getMyContacts(
    caller   : Principal,
    contacts : Map.Map<Principal, Set.Set<Principal>>,
  ) : [Principal] {
    switch (contacts.get(caller)) {
      case null [];
      case (?s) s.toArray();
    }
  };

  /// Return all incoming pending invitations for `caller`.
  public func getPendingInvitations(
    caller      : Principal,
    invitations : Map.Map<Text, ContactInvitation>,
  ) : [ContactInvitation] {
    invitations.values()
      .filter(func (inv : ContactInvitation) : Bool {
        inv.toPrincipal == caller and inv.status == #Pending
      })
      .toArray()
  };

  /// Verify two principals are mutual contacts.
  public func checkMutualContact(
    a        : Principal,
    b        : Principal,
    contacts : Map.Map<Principal, Set.Set<Principal>>,
  ) : Bool {
    areMutualContacts(contacts, a, b)
  };

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════

  /// Send a message from `caller` to `to`. Both must be mutual contacts.
  public func sendMessage(
    caller         : Principal,
    to             : Principal,
    content        : Text,
    contacts       : Map.Map<Principal, Set.Set<Principal>>,
    messages       : Map.Map<Text, Message>,
    messagesByPair : Map.Map<Text, [Text]>,
    mkId           : (Text, Nat) -> Text,
    seq            : Nat,
  ) : { #ok : Text; #err : Text } {
    if (not areMutualContacts(contacts, caller, to))
      return #err("Can only message mutual contacts");
    if (content.isEmpty()) return #err("Message cannot be empty");
    let id = mkId("msg", seq);
    let msg : Message = {
      id;
      fromPrincipal = caller;
      toPrincipal   = to;
      content;
      sentAt        = Time.now();
      readAt        = null;
    };
    messages.add(id, msg);
    // Append id to the pair thread
    let key = pairKey(caller, to);
    let existing : [Text] = switch (messagesByPair.get(key)) {
      case (?ids) ids;
      case null [];
    };
    messagesByPair.add(key, existing.concat([id]));
    #ok id
  };

  /// Return all messages in the conversation between `caller` and `other`.
  /// Caller must be one of the two participants.
  public func getMessages(
    caller         : Principal,
    other          : Principal,
    messages       : Map.Map<Text, Message>,
    messagesByPair : Map.Map<Text, [Text]>,
  ) : { #ok : [Message]; #err : Text } {
    let key = pairKey(caller, other);
    let ids : [Text] = switch (messagesByPair.get(key)) {
      case (?arr) arr;
      case null [];
    };
    let msgs = ids.filterMap(func (id : Text) : ?Message {
      switch (messages.get(id)) {
        case (?m) {
          // Security: caller must be a participant
          if (m.fromPrincipal == caller or m.toPrincipal == caller) ?m
          else null
        };
        case null null;
      }
    });
    #ok msgs
  };

  /// Update readAt timestamp for a message. Caller must be the recipient.
  public func markMessageRead(
    caller   : Principal,
    msgId    : Text,
    messages : Map.Map<Text, Message>,
  ) : { #ok; #err : Text } {
    switch (messages.get(msgId)) {
      case null #err("Message not found");
      case (?m) {
        if (m.toPrincipal != caller) return #err("Not your message");
        messages.add(msgId, { m with readAt = ?Time.now() });
        #ok
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ASSET SHARING
  // ═══════════════════════════════════════════════════════════════════

  /// Share a private asset with a contact. Caller must own the asset
  /// and be a mutual contact with the recipient.
  /// `assetOwner` is passed separately so the caller can be verified externally.
  public func shareAssetWithContact(
    caller      : Principal,
    assetId     : Text,
    assetOwner  : Principal,
    recipient   : Principal,
    contacts    : Map.Map<Principal, Set.Set<Principal>>,
    assetShares : Map.Map<Text, AssetShare>,
  ) : { #ok; #err : Text } {
    if (assetOwner != caller) return #err("Not the asset owner");
    if (not areMutualContacts(contacts, caller, recipient))
      return #err("Recipient is not a mutual contact");
    let key = shareKey(assetId, recipient);
    switch (assetShares.get(key)) {
      case (?existing) {
        if (not existing.revoked) return #err("Asset already shared with this contact");
        // Re-share after revocation
      };
      case null {};
    };
    assetShares.add(key, {
      assetId;
      ownerPrincipal      = caller;
      sharedWithPrincipal = recipient;
      sharedAt            = Time.now();
      revoked             = false;
    });
    #ok
  };

  /// Revoke a sharing permission. Owner only.
  public func revokeAssetShare(
    caller      : Principal,
    assetId     : Text,
    recipient   : Principal,
    assetShares : Map.Map<Text, AssetShare>,
  ) : { #ok; #err : Text } {
    let key = shareKey(assetId, recipient);
    switch (assetShares.get(key)) {
      case null #err("Share not found");
      case (?s) {
        if (s.ownerPrincipal != caller) return #err("Not the asset owner");
        if (s.revoked) return #err("Already revoked");
        assetShares.add(key, { s with revoked = true });
        #ok
      };
    }
  };

  /// Return all non-revoked assets shared with `caller`.
  public func getSharedAssetsWithMe(
    caller      : Principal,
    assetShares : Map.Map<Text, AssetShare>,
  ) : [AssetShare] {
    assetShares.values()
      .filter(func (s : AssetShare) : Bool {
        s.sharedWithPrincipal == caller and not s.revoked
      })
      .toArray()
  };

  // ═══════════════════════════════════════════════════════════════════
  // DOWNLOAD MANIFEST
  // ═══════════════════════════════════════════════════════════════════

  /// Generate a download manifest for a signed copy.
  /// `caller` must be the current owner of the signed copy.
  /// All signer info, ICRC-7 metadata, and file refs are embedded.
  ///
  /// Parameters:
  ///   signedCopyId     – the ID of the signed copy
  ///   owner            – stored owner of the signed copy (verified externally)
  ///   caller           – must equal owner
  ///   certificateId    – cert ID from the signed copy
  ///   tokenId          – ICRC-7 token id (Nat)
  ///   assetName        – title of the underlying asset
  ///   fileRefs         – file references attached to the asset
  ///   signers          – all signers on the signed copy
  ///   assetId          – the underlying asset id
  ///   authenticityHash – hash stored on the signed copy
  ///   sequenceNumber   – the copy's sequence number
  public func generateDownloadManifest(
    caller           : Principal,
    owner            : Principal,
    signedCopyId     : Text,
    certificateId    : Text,
    tokenId          : Nat,
    assetName        : Text,
    fileRefs         : [FileRef],
    signers          : [SignerInfo],
    assetId          : Text,
    authenticityHash : Text,
    sequenceNumber   : Nat,
  ) : { #ok : DownloadManifest; #err : Text } {
    if (caller != owner) return #err("Only the owner can download this signed copy");
    let meta : Icrc7Metadata = {
      tokenId;
      certificateId;
      assetId;
      authenticityHash;
      creatorPrincipal = signers[0].principal.toText(); // primary creator is first signer
      allSigners       = signers;
      sequenceNumber;
    };
    #ok {
      signedCopyId;
      certificateId;
      tokenId;
      assetName;
      fileRefs;
      allSigners    = signers;
      icrc7Metadata = meta;
      downloadedAt  = Time.now();
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SUPPORT FORM
  // ═══════════════════════════════════════════════════════════════════

  /// Store a support form submission.
  /// Returns #err if subject or message is empty.
  public func submitSupportForm(
    caller       : ?Principal,
    subject      : Text,
    message      : Text,
    contactEmail : ?Text,
    submissions  : Map.Map<Text, SupportSubmission>,
    mkId         : (Text, Nat) -> Text,
    seq          : Nat,
  ) : { #ok : Text; #err : Text } {
    if (subject.isEmpty() or message.isEmpty())
      return #err("Subject and message are required");
    let id = mkId("sup", seq);
    submissions.add(id, {
      id;
      subject;
      message;
      contactEmail;
      submittedBy = caller;
      createdAt   = Time.now();
    });
    #ok id
  };

  // ═══════════════════════════════════════════════════════════════════
  // DOMAIN VERIFICATION
  // ═══════════════════════════════════════════════════════════════════

  /// Returns the canonical domain verification string for OnlySigned.
  /// This is a public query — no auth required.
  public func getWellKnownDomainVerification() : Text {
    "domain-verification=onlysigned.com"
  };

}
