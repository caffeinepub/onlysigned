import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Time "mo:base/Time";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import InviteLinksModule "invite-links/invite-links-module";

module {
  // Old types
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

  // Old actor type definition
  type OldActor = {
    var collections : OrderedMap.Map<Text, Collection>;
    var digitalAssets : OrderedMap.Map<Text, DigitalAsset>;
    var signedCopies : OrderedMap.Map<Text, SignedCopy>;
    var marketplaceListings : OrderedMap.Map<Text, MarketplaceListing>;
    var userProfiles : OrderedMap.Map<Principal, UserProfile>;
    var wallets : OrderedMap.Map<Principal, Wallet>;
    var withdrawalRequests : OrderedMap.Map<Text, WithdrawalRequest>;
    var usernameNFTs : OrderedMap.Map<Text, UsernameNFT>;
    var adminAssetTransfers : OrderedMap.Map<Text, AdminAssetTransfer>;
    var usernameNFTOffers : OrderedMap.Map<Text, UsernameNFTOffer>;
    var nextUserNumber : Nat;
    var privacyPolicy : ?PrivacyPolicy;
    var contacts : OrderedMap.Map<Text, Contact>;
    var sharedAssetPermissions : OrderedMap.Map<Text, SharedAssetPermission>;
    var chatMessages : OrderedMap.Map<Text, ChatMessage>;
    var chatConversations : OrderedMap.Map<Text, ChatConversation>;
    var marketplaceTransactions : OrderedMap.Map<Text, MarketplaceTransaction>;
    var dailyMetrics : OrderedMap.Map<Text, DailyMetrics>;
    var supportFormSubmissions : OrderedMap.Map<Text, SupportFormSubmission>;
    var followRelationships : OrderedMap.Map<Text, FollowRelationship>;
    var downloadRecords : OrderedMap.Map<Text, DownloadRecord>;
    var stripeConfiguration : ?{
      secretKey : Text;
      allowedCountries : [Text];
    };
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
    inviteState : InviteLinksModule.InviteLinksSystemState;
  };

  // New actor type definition
  type NewActor = {
    var collections : OrderedMap.Map<Text, Collection>;
    var digitalAssets : OrderedMap.Map<Text, DigitalAsset>;
    var signedCopies : OrderedMap.Map<Text, SignedCopy>;
    var marketplaceListings : OrderedMap.Map<Text, MarketplaceListing>;
    var userProfiles : OrderedMap.Map<Principal, UserProfile>;
    var wallets : OrderedMap.Map<Principal, Wallet>;
    var withdrawalRequests : OrderedMap.Map<Text, WithdrawalRequest>;
    var usernameNFTs : OrderedMap.Map<Text, UsernameNFT>;
    var adminAssetTransfers : OrderedMap.Map<Text, AdminAssetTransfer>;
    var usernameNFTOffers : OrderedMap.Map<Text, UsernameNFTOffer>;
    var nextUserNumber : Nat;
    var privacyPolicy : ?PrivacyPolicy;
    var contacts : OrderedMap.Map<Text, Contact>;
    var sharedAssetPermissions : OrderedMap.Map<Text, SharedAssetPermission>;
    var chatMessages : OrderedMap.Map<Text, ChatMessage>;
    var chatConversations : OrderedMap.Map<Text, ChatConversation>;
    var marketplaceTransactions : OrderedMap.Map<Text, MarketplaceTransaction>;
    var dailyMetrics : OrderedMap.Map<Text, DailyMetrics>;
    var supportFormSubmissions : OrderedMap.Map<Text, SupportFormSubmission>;
    var followRelationships : OrderedMap.Map<Text, FollowRelationship>;
    var downloadRecords : OrderedMap.Map<Text, DownloadRecord>;
    var stripeConfiguration : ?{
      secretKey : Text;
      allowedCountries : [Text];
    };
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
    inviteState : InviteLinksModule.InviteLinksSystemState;
  };

  public func run(old : OldActor) : NewActor {
    {
      var collections = old.collections;
      var digitalAssets = old.digitalAssets;
      var signedCopies = old.signedCopies;
      var marketplaceListings = old.marketplaceListings;
      var userProfiles = old.userProfiles;
      var wallets = old.wallets;
      var withdrawalRequests = old.withdrawalRequests;
      var usernameNFTs = old.usernameNFTs;
      var adminAssetTransfers = old.adminAssetTransfers;
      var usernameNFTOffers = old.usernameNFTOffers;
      var nextUserNumber = old.nextUserNumber;
      var privacyPolicy = old.privacyPolicy;
      var contacts = old.contacts;
      var sharedAssetPermissions = old.sharedAssetPermissions;
      var chatMessages = old.chatMessages;
      var chatConversations = old.chatConversations;
      var marketplaceTransactions = old.marketplaceTransactions;
      var dailyMetrics = old.dailyMetrics;
      var supportFormSubmissions = old.supportFormSubmissions;
      var followRelationships = old.followRelationships;
      var downloadRecords = old.downloadRecords;
      var stripeConfiguration = old.stripeConfiguration;
      accessControlState = old.accessControlState;
      approvalState = old.approvalState;
      inviteState = old.inviteState;
    };
  };
};

