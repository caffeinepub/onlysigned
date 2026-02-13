import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import BlobStorage "blob-storage/Mixin";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Registry "blob-storage/registry";
import Int "mo:base/Int";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import InviteLinksModule "invite-links/invite-links-module";
import Random "mo:base/Random";
import Migration "migration";

(with migration = Migration.run)
persistent actor {
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  type Collection = {
    id : Text;
    creator : Principal;
    name : Text;
    createdTime : Time.Time;
    assetIds : [Text];
    isForSale : Bool;
    price : ?Nat;
    currency : ?Currency;
    saleMethod : ?SaleMethod;
    owner : Principal;
    isPublic : Bool;
  };

  type DigitalAsset = {
    id : Text;
    owner : Principal;
    title : Text;
    description : Text;
    filePaths : [Text];
    fileTypes : [Text];
    uploadTime : Time.Time;
    isSigned : Bool;
    creator : ?Principal;
    signatureCount : Nat;
    basePrice : Nat;
    royaltyPercentage : Nat;
    collectionId : ?Text;
    isPublic : Bool;
  };

  type SignedCopy = {
    id : Text;
    assetId : Text;
    signer : Principal;
    owner : Principal;
    sequenceNumber : Nat;
    signatureTime : Time.Time;
    certificate : Text;
    price : Nat;
    currency : Currency;
    isForSale : Bool;
    isPublic : Bool;
    uniqueUrl : Text;
  };

  type Currency = {
    #ckusdc;
    #ckusdt;
    #icp;
    #ckbtc;
  };

  type MarketplaceListing = {
    id : Text;
    signedCopyId : Text;
    seller : Principal;
    price : Nat;
    currency : Currency;
    isActive : Bool;
    listingTime : Time.Time;
    saleMethod : SaleMethod;
  };

  type SaleMethod = {
    #direct;
    #auction;
  };

  type TrustedPartyType = {
    #creator;
    #celebrity;
    #institution;
    #government;
  };

  type UserProfile = {
    principal : Principal;
    displayName : Text;
    bio : Text;
    profileImage : ?Text;
    isCreator : Bool;
    isAdmin : Bool;
    isVerified : Bool;
    usernameNFT : ?Text;
    userNumber : Nat;
    birthdate : ?Int;
    email : ?Text;
    profilePhoto : ?Text;
    personalUrl : ?Text;
    isTrustedParty : Bool;
    trustedPartyType : ?TrustedPartyType;
    username : ?Text;
  };

  type Wallet = {
    icpBalance : Nat;
    ckbtcBalance : Nat;
    ckusdcBalance : Nat;
    ckusdtBalance : Nat;
  };

  type WithdrawalRequest = {
    id : Text;
    user : Principal;
    currency : Currency;
    amount : Nat;
    destinationPrincipal : ?Text;
    status : WithdrawalStatus;
    requestTime : Time.Time;
  };

  type WithdrawalStatus = {
    #pending;
    #completed;
    #failed;
  };

  type UsernameNFT = {
    id : Text;
    username : Text;
    owner : Principal;
    isVerified : Bool;
    mintedTime : Time.Time;
    certificate : Text;
  };

  type AdminAssetTransfer = {
    id : Text;
    assetId : Text;
    fromAdmin : Principal;
    toUser : Principal;
    transferTime : Time.Time;
    certificate : Text;
  };

  type AdminDashboardStats = {
    totalUsers : Nat;
    activeUsers : Nat;
    totalCollections : Nat;
    totalAssets : Nat;
    totalSignedCopies : Nat;
    totalMarketplaceListings : Nat;
    totalWithdrawals : Nat;
    cyclesBalance : Nat;
    canisterId : Text;
  };

  type UsernameNFTOffer = {
    id : Text;
    username : Text;
    offeringUser : Principal;
    offerAmount : Nat;
    currency : Currency;
    status : OfferStatus;
    submissionTime : Time.Time;
    isForExistingNFT : Bool;
  };

  type OfferStatus = {
    #pending;
    #accepted;
    #rejected;
  };

  type CertificateValidationResult = {
    isValid : Bool;
    signedCopy : ?SignedCopy;
    creator : ?UserProfile;
    asset : ?DigitalAsset;
    message : Text;
  };

  type PrivacyPolicy = {
    content : Text;
    lastUpdated : Time.Time;
    version : Nat;
  };

  type ContactStatus = {
    #pending;
    #accepted;
    #declined;
  };

  type Contact = {
    user : Principal;
    contact : Principal;
    status : ContactStatus;
    createdTime : Time.Time;
  };

  type SharedAssetPermission = {
    assetId : Text;
    owner : Principal;
    sharedWith : Principal;
    grantedTime : Time.Time;
    isActive : Bool;
  };

  type ChatMessage = {
    id : Text;
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Time.Time;
    isRead : Bool;
  };

  type ChatConversation = {
    participants : [Principal];
    messages : [ChatMessage];
  };

  type MarketplaceTransaction = {
    id : Text;
    transactionType : TransactionType;
    involvedUsers : [Principal];
    assetId : ?Text;
    copyId : ?Text;
    collectionId : ?Text;
    price : Nat;
    currency : Currency;
    timestamp : Time.Time;
  };

  type TransactionType = {
    #sale;
    #purchase;
    #offer;
    #transfer;
  };

  type DailyMetrics = {
    date : Int;
    newUsers : Nat;
    assetsUploaded : Nat;
    signedCopiesCreated : Nat;
    salesCompleted : Nat;
    totalTransactionVolume : Nat;
  };

  type SupportFormSubmission = {
    id : Text;
    subject : Text;
    message : Text;
    contactEmail : ?Text;
    timestamp : Time.Time;
    status : SubmissionStatus;
  };

  type SubmissionStatus = {
    #pending;
    #sent;
    #failed;
  };

  type FollowRelationship = {
    follower : Principal;
    following : Principal;
    createdTime : Time.Time;
  };

  type DownloadRecord = {
    id : Text;
    signedCopyId : Text;
    user : Principal;
    downloadTime : Time.Time;
  };

  var collections = textMap.empty<Collection>();
  var digitalAssets = textMap.empty<DigitalAsset>();
  var signedCopies = textMap.empty<SignedCopy>();
  var marketplaceListings = textMap.empty<MarketplaceListing>();
  var userProfiles = principalMap.empty<UserProfile>();
  var wallets = principalMap.empty<Wallet>();
  var withdrawalRequests = textMap.empty<WithdrawalRequest>();
  var usernameNFTs = textMap.empty<UsernameNFT>();
  var adminAssetTransfers = textMap.empty<AdminAssetTransfer>();
  var usernameNFTOffers = textMap.empty<UsernameNFTOffer>();
  var nextUserNumber : Nat = 0;
  var privacyPolicy : ?PrivacyPolicy = null;
  var contacts = textMap.empty<Contact>();
  var sharedAssetPermissions = textMap.empty<SharedAssetPermission>();
  var chatMessages = textMap.empty<ChatMessage>();
  var chatConversations = textMap.empty<ChatConversation>();
  var marketplaceTransactions = textMap.empty<MarketplaceTransaction>();
  var dailyMetrics = textMap.empty<DailyMetrics>();
  var supportFormSubmissions = textMap.empty<SupportFormSubmission>();
  var followRelationships = textMap.empty<FollowRelationship>();
  var downloadRecords = textMap.empty<DownloadRecord>();

  let registry = Registry.new();

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);

  let inviteState = InviteLinksModule.initState();

  // Helper function to count followers for a user
  func getFollowerCount(user : Principal) : Nat {
    let allFollows = Iter.toArray(textMap.vals(followRelationships));
    let followers = Array.filter(
      allFollows,
      func(follow : FollowRelationship) : Bool {
        follow.following == user;
      },
    );
    followers.size();
  };

  // Helper function to count following for a user
  func getFollowingCount(user : Principal) : Nat {
    let allFollows = Iter.toArray(textMap.vals(followRelationships));
    let following = Array.filter(
      allFollows,
      func(follow : FollowRelationship) : Bool {
        follow.follower == user;
      },
    );
    following.size();
  };

  // Helper function to check if user1 follows user2
  func isFollowing(user1 : Principal, user2 : Principal) : Bool {
    let allFollows = Iter.toArray(textMap.vals(followRelationships));
    switch (Array.find(
      allFollows,
      func(follow : FollowRelationship) : Bool {
        follow.follower == user1 and follow.following == user2;
      },
    )) {
      case null false;
      case (?_) true;
    };
  };

  // Helper function to check if user meets Certificate Issuer requirements
  func canIssueCertificates(user : Principal) : Bool {
    switch (principalMap.get(userProfiles, user)) {
      case null false;
      case (?profile) {
        // Admin is always exempt from follower requirement
        if (profile.isAdmin) {
          return true;
        };
        // Must be a Certificate Issuer with at least 500 followers
        profile.isCreator and getFollowerCount(user) >= 500;
      };
    };
  };

  // Helper function to check if two users have mutual contact relationship
  func areMutualContacts(user1 : Principal, user2 : Principal) : Bool {
    let allContacts = Iter.toArray(textMap.vals(contacts));
    let contact1to2 = Array.find(
      allContacts,
      func(contact : Contact) : Bool {
        contact.user == user1 and contact.contact == user2 and contact.status == #accepted;
      },
    );
    let contact2to1 = Array.find(
      allContacts,
      func(contact : Contact) : Bool {
        contact.user == user2 and contact.contact == user1 and contact.status == #accepted;
      },
    );
    contact1to2 != null and contact2to1 != null;
  };

  // Helper function to check if user has access to an asset
  func hasAssetAccess(user : Principal, assetId : Text) : Bool {
    switch (textMap.get(digitalAssets, assetId)) {
      case null false;
      case (?asset) {
        // Owner always has access
        if (asset.owner == user) {
          return true;
        };
        // Public assets are accessible to all
        if (asset.isPublic) {
          return true;
        };
        // Check if asset is shared with user
        let allPermissions = Iter.toArray(textMap.vals(sharedAssetPermissions));
        let sharedPermission = Array.find(
          allPermissions,
          func(permission : SharedAssetPermission) : Bool {
            permission.assetId == assetId and permission.sharedWith == user and permission.isActive;
          },
        );
        sharedPermission != null;
      };
    };
  };

  // Helper function to check if caller is admin
  func isCallerAdminUser(caller : Principal) : Bool {
    switch (principalMap.get(userProfiles, caller)) {
      case null false;
      case (?profile) profile.isAdmin;
    };
  };

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can generate invite codes");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view RSVPs");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view invite codes");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public shared ({ caller }) func reclaimAdminAccess() : async () {
    // SECURITY: Only the first user (userNumber == 1) can reclaim admin access
    // This is a recovery mechanism for the original admin
    switch (principalMap.get(userProfiles, caller)) {
      case null Debug.trap("User profile not found. Please create a profile first.");
      case (?profile) {
        if (profile.userNumber != 1) {
          Debug.trap("Unauthorized: Only the original admin (first user) can reclaim admin access");
        };

        // Restore admin role in access control
        AccessControl.assignRole(accessControlState, caller, caller, #admin);

        // Update profile to reflect admin status
        let updatedProfile = {
          profile with isAdmin = true
        };
        userProfiles := principalMap.put(userProfiles, caller, updatedProfile);

        Debug.trap("Admin access has been successfully reclaimed. Please click 'OK' to continue and refresh the page.");
      };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    isCallerAdminUser(caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Users can view their own profile or any other user's profile (public social platform)
    // No special admin privilege needed for viewing profiles
    principalMap.get(userProfiles, user);
  };

  func isDisplayNameUniqueForPrincipal(displayName : Text, principal : Principal) : Bool {
    let allProfiles = Iter.toArray(principalMap.vals(userProfiles));
    switch (Array.find(allProfiles, func(profile : UserProfile) : Bool { 
      profile.displayName == displayName and profile.principal != principal 
    })) {
      case null true;
      case (?_) false;
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };

    if (not isDisplayNameUniqueForPrincipal(profile.displayName, caller)) {
      Debug.trap("Display name already taken by another user");
    };

    switch (profile.username) {
      case null {};
      case (?username) {
        let allNFTs = Iter.toArray(textMap.vals(usernameNFTs));
        switch (Array.find(allNFTs, func(nft : UsernameNFT) : Bool { 
          nft.owner == caller and nft.username == username 
        })) {
          case null Debug.trap("Cannot set username without owning the corresponding UsernameNFT");
          case (?_) {};
        };
      };
    };

    let userNumber = switch (principalMap.get(userProfiles, caller)) {
      case null {
        let currentNumber = nextUserNumber;
        nextUserNumber += 1;
        currentNumber;
      };
      case (?existingProfile) existingProfile.userNumber;
    };

    let isAdmin = userNumber == 1;

    let updatedProfile = {
      profile with
      principal = caller;
      isAdmin;
      userNumber;
    };
    userProfiles := principalMap.put(userProfiles, caller, updatedProfile);
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Debug.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  include BlobStorage(registry);
};

