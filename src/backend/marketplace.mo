import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

// ─── OnlySigned Marketplace Module ───────────────────────────────────────────
// Standalone module providing all marketplace types and logic.
// State (listings, wallets, transactions, auditLog, dailyMetrics) is owned by
// the actor and passed into every operation so this module remains stateless.
// ─────────────────────────────────────────────────────────────────────────────

module {

  // ═══════════════════════════════════════════════════════════════════
  // TYPES
  // ═══════════════════════════════════════════════════════════════════

  public type ItemType = { #SignedCopy; #Collection };
  public type SaleMethod = { #Direct; #Auction };

  public type MarketplaceListing = {
    id              : Text;
    itemType        : ItemType;
    itemId          : Text;
    sellerPrincipal : Principal;
    price           : Nat;
    currency        : Text;       // "ICP" | "ckBTC" | "ckUSDC" | "ckUSDT"
    saleMethod      : SaleMethod;
    highestBid      : ?Nat;
    highestBidder   : ?Principal;
    listedAt        : Int;
    active          : Bool;
  };

  public type WalletBalance = {
    icp    : Nat;
    ckbtc  : Nat;
    ckusdc : Nat;
    ckusdt : Nat;
  };

  public type TxType = {
    #Purchase;
    #Sale;
    #Royalty;
    #Withdrawal;
    #Deposit;
    #Bid;
    #OfferPayment;
  };

  public type Transaction = {
    id                 : Text;
    fromPrincipal      : ?Principal;
    toPrincipal        : Principal;
    txType             : TxType;
    itemId             : ?Text;
    amount             : Nat;
    currency           : Text;
    timestamp          : Int;
    destinationAddress : ?Text;
  };

  public type AuditLogEntry = Transaction;  // same shape, stored separately

  public type DailyMetrics = {
    date                 : Text; // "YYYY-MM-DD" or day-index text
    newUsers             : Nat;
    assetsUploaded       : Nat;
    signedCopiesCreated  : Nat;
    salesCompleted       : Nat;
    totalTransactionVolume : Nat;
  };

  // Thin ownership/royalty info passed in from the actor during purchase
  public type ItemOwnershipInfo = {
    ownerPrincipal  : Principal;
    creatorPrincipal : Principal;  // for royalty — original asset creator
    royaltyBps      : Nat;         // basis points, e.g. 500 = 5%
  };

  // Result helpers
  public type Result<T> = { #ok : T; #err : Text };

  // ═══════════════════════════════════════════════════════════════════
  // STATE TYPE ALIASES (passed in by the actor)
  // ═══════════════════════════════════════════════════════════════════

  public type Listings     = Map.Map<Text, MarketplaceListing>;
  public type Wallets      = Map.Map<Principal, WalletBalance>;
  public type Transactions = Map.Map<Text, Transaction>;
  public type AuditLog     = List.List<AuditLogEntry>;
  public type Metrics      = Map.Map<Text, DailyMetrics>;

  // ═══════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════

  func now() : Int { Time.now() };

  func mkId(seq : Nat) : Text {
    "mkt-" # seq.toText() # "-" # (now() / 1_000_000).toText()
  };

  func todayKey() : Text {
    let secs = now() / 1_000_000_000;
    let day = secs / 86_400;
    day.toText()
  };

  func getBalance(w : WalletBalance, currency : Text) : Nat {
    switch currency {
      case "ICP"    w.icp;
      case "ckBTC"  w.ckbtc;
      case "ckUSDC" w.ckusdc;
      case "ckUSDT" w.ckusdt;
      case _        0;
    }
  };

  func setBalance(w : WalletBalance, currency : Text, bal : Nat) : WalletBalance {
    switch currency {
      case "ICP"    { { w with icp    = bal } };
      case "ckBTC"  { { w with ckbtc  = bal } };
      case "ckUSDC" { { w with ckusdc = bal } };
      case "ckUSDT" { { w with ckusdt = bal } };
      case _        w;
    }
  };

  func getOrInitWallet(wallets : Wallets, owner : Principal) : WalletBalance {
    switch (wallets.get(owner)) {
      case (?w) w;
      case null {
        let w : WalletBalance = { icp = 0; ckbtc = 0; ckusdc = 0; ckusdt = 0 };
        wallets.add(owner, w);
        w
      };
    }
  };

  func debit(wallets : Wallets, owner : Principal, amount : Nat, currency : Text) : Bool {
    if (amount == 0) return true;
    let w = getOrInitWallet(wallets, owner);
    let bal = getBalance(w, currency);
    if (bal < amount) return false;
    wallets.add(owner, setBalance(w, currency, bal - amount));
    true
  };

  func credit(wallets : Wallets, owner : Principal, amount : Nat, currency : Text) {
    if (amount == 0) return;
    let w = getOrInitWallet(wallets, owner);
    let bal = getBalance(w, currency);
    wallets.add(owner, setBalance(w, currency, bal + amount))
  };

  func recordTx(
    txs      : Transactions,
    auditLog : AuditLog,
    seq      : Nat,
    txType   : TxType,
    from_    : ?Principal,
    to_      : Principal,
    amount   : Nat,
    currency : Text,
    itemId   : ?Text,
    destAddr : ?Text,
  ) {
    let id = "tx-" # seq.toText() # "-" # (now() / 1_000_000).toText();
    let entry : Transaction = {
      id;
      fromPrincipal      = from_;
      toPrincipal        = to_;
      txType;
      itemId;
      amount;
      currency;
      timestamp          = now();
      destinationAddress = destAddr;
    };
    txs.add(id, entry);
    auditLog.add(entry);
  };

  func upsertMetric(metrics : Metrics, field : Text) {
    let key = todayKey();
    let m : DailyMetrics = switch (metrics.get(key)) {
      case (?existing) existing;
      case null {
        { date = key; newUsers = 0; assetsUploaded = 0;
          signedCopiesCreated = 0; salesCompleted = 0; totalTransactionVolume = 0 }
      };
    };
    let updated : DailyMetrics = switch field {
      case "salesCompleted" { { m with salesCompleted = m.salesCompleted + 1 } };
      case _                m;
    };
    metrics.add(key, updated)
  };

  func addVolume(metrics : Metrics, amount : Nat) {
    let key = todayKey();
    let m : DailyMetrics = switch (metrics.get(key)) {
      case (?existing) existing;
      case null {
        { date = key; newUsers = 0; assetsUploaded = 0;
          signedCopiesCreated = 0; salesCompleted = 0; totalTransactionVolume = 0 }
      };
    };
    metrics.add(key, { m with totalTransactionVolume = m.totalTransactionVolume + amount })
  };

  // Simple ICP principal address validation: non-empty and plausible format
  func isValidPrincipal(addr : Text) : Bool {
    if (addr.isEmpty()) return false;
    // Principal text is base32 encoded groups separated by dashes
    // Minimal check: non-empty, at least one dash, reasonable length
    addr.size() >= 5 and addr.size() <= 64 and addr.contains(#char '-')
  };

  // ═══════════════════════════════════════════════════════════════════
  // LISTING OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  /// Create a new marketplace listing.
  /// ownerCheck: pass in the verified owner principal of the item.
  public func listForSale(
    listings    : Listings,
    seq         : Nat,
    caller      : Principal,
    ownerOfItem : Principal,
    itemType    : ItemType,
    itemId      : Text,
    price       : Nat,
    currency    : Text,
    saleMethod  : SaleMethod,
  ) : Result<Text> {
    if (caller != ownerOfItem) return #err("Not the owner of this item");
    let id = mkId(seq);
    let listing : MarketplaceListing = {
      id;
      itemType;
      itemId;
      sellerPrincipal = caller;
      price;
      currency;
      saleMethod;
      highestBid      = null;
      highestBidder   = null;
      listedAt        = now();
      active          = true;
    };
    listings.add(id, listing);
    #ok id
  };

  /// Delist an item. Caller must be the seller or isAdminCaller = true.
  public func delistItem(
    listings      : Listings,
    caller        : Principal,
    listingId     : Text,
    isAdminCaller : Bool,
  ) : Result<()> {
    switch (listings.get(listingId)) {
      case null #err("Listing not found");
      case (?l) {
        if (l.sellerPrincipal != caller and not isAdminCaller)
          return #err("Not authorized to delist this item");
        listings.add(listingId, { l with active = false });
        #ok ()
      };
    }
  };

  /// Return all active listings, with optional filters.
  public func getListings(
    listings        : Listings,
    currencyFilter  : ?Text,
    saleMethodFilter : ?SaleMethod,
    itemTypeFilter  : ?ItemType,
  ) : [MarketplaceListing] {
    listings.values()
      .filter(func (l : MarketplaceListing) : Bool {
        if (not l.active) return false;
        let okCurrency = switch currencyFilter {
          case null true;
          case (?c) l.currency == c;
        };
        let okMethod = switch saleMethodFilter {
          case null true;
          case (?m) l.saleMethod == m;
        };
        let okType = switch itemTypeFilter {
          case null true;
          case (?t) l.itemType == t;
        };
        okCurrency and okMethod and okType
      })
      .toArray()
  };

  public func getListing(listings : Listings, id : Text) : ?MarketplaceListing {
    listings.get(id)
  };

  // ═══════════════════════════════════════════════════════════════════
  // PURCHASE (Direct Sale)
  // ═══════════════════════════════════════════════════════════════════

  /// Process a direct purchase.
  /// itemInfo: resolved ownership + royalty for the item being purchased.
  /// txSeq: current sequence counter (actor must increment before calling).
  /// Returns #ok on success; does NOT mutate item ownership (caller must do that).
  public func purchaseItem(
    listings : Listings,
    wallets  : Wallets,
    txs      : Transactions,
    auditLog : AuditLog,
    metrics  : Metrics,
    txSeq    : Nat,
    caller   : Principal,
    listingId : Text,
    itemInfo : ItemOwnershipInfo,
  ) : Result<()> {
    switch (listings.get(listingId)) {
      case null return #err("Listing not found");
      case (?l) {
        if (not l.active)      return #err("Listing is no longer active");
        if (l.saleMethod != #Direct) return #err("Use placeBid/finalizeAuction for auctions");
        if (l.sellerPrincipal == caller) return #err("Cannot purchase your own listing");

        // Payment handling (skip for zero-price)
        if (l.price > 0) {
          if (not debit(wallets, caller, l.price, l.currency))
            return #err("Insufficient wallet balance");

          // Royalty distribution (basis points)
          let royaltyAmount : Nat =
            if (itemInfo.royaltyBps > 0)
              (l.price * itemInfo.royaltyBps) / 10_000
            else 0;

          if (royaltyAmount > 0) {
            credit(wallets, itemInfo.creatorPrincipal, royaltyAmount, l.currency);
            recordTx(txs, auditLog, txSeq, #Royalty,
              ?caller, itemInfo.creatorPrincipal,
              royaltyAmount, l.currency, ?l.itemId, null);
          };

          let sellerAmount : Nat = if (l.price >= royaltyAmount) l.price - royaltyAmount else 0;
          credit(wallets, l.sellerPrincipal, sellerAmount, l.currency);
          recordTx(txs, auditLog, txSeq + 1, #Sale,
            ?caller, l.sellerPrincipal,
            sellerAmount, l.currency, ?l.itemId, null);
          recordTx(txs, auditLog, txSeq + 2, #Purchase,
            ?caller, l.sellerPrincipal,
            l.price, l.currency, ?l.itemId, null);

          addVolume(metrics, l.price);
        };

        // Mark listing inactive
        listings.add(listingId, { l with active = false });
        upsertMetric(metrics, "salesCompleted");
        #ok ()
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // BID (Auction)
  // ═══════════════════════════════════════════════════════════════════

  /// Place a bid on an auction listing.
  public func placeBid(
    listings  : Listings,
    wallets   : Wallets,
    txs       : Transactions,
    auditLog  : AuditLog,
    txSeq     : Nat,
    caller    : Principal,
    listingId : Text,
    amount    : Nat,
  ) : Result<()> {
    switch (listings.get(listingId)) {
      case null return #err("Listing not found");
      case (?l) {
        if (not l.active)           return #err("Listing is no longer active");
        if (l.saleMethod != #Auction) return #err("This listing is not an auction");
        if (l.sellerPrincipal == caller) return #err("Cannot bid on your own listing");

        let minBid = switch (l.highestBid) { case (?b) b + 1; case null l.price };
        if (amount < minBid)
          return #err("Bid must be at least " # minBid.toText());

        // Validate buyer balance
        if (not debit(wallets, caller, amount, l.currency))
          return #err("Insufficient wallet balance");

        // Refund previous highest bidder
        switch (l.highestBidder, l.highestBid) {
          case (?prevBidder, ?prevBid) {
            credit(wallets, prevBidder, prevBid, l.currency);
            recordTx(txs, auditLog, txSeq, #Deposit,
              null, prevBidder, prevBid, l.currency, ?l.itemId, null);
          };
          case _ {};
        };

        listings.add(listingId, { l with highestBid = ?amount; highestBidder = ?caller });
        recordTx(txs, auditLog, txSeq + 1, #Bid,
          ?caller, l.sellerPrincipal, amount, l.currency, ?l.itemId, null);
        #ok ()
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // FINALIZE AUCTION
  // ═══════════════════════════════════════════════════════════════════

  /// Finalize an auction. Must be called by admin or owner.
  /// Returns the winner principal (actor must transfer item ownership).
  public func finalizeAuction(
    listings      : Listings,
    wallets       : Wallets,
    txs           : Transactions,
    auditLog      : AuditLog,
    metrics       : Metrics,
    txSeq         : Nat,
    caller        : Principal,
    listingId     : Text,
    isAdminCaller : Bool,
    itemInfo      : ItemOwnershipInfo,
  ) : Result<Principal> {
    switch (listings.get(listingId)) {
      case null return #err("Listing not found");
      case (?l) {
        if (not l.active) return #err("Listing is no longer active");
        if (l.saleMethod != #Auction) return #err("Not an auction listing");
        if (l.sellerPrincipal != caller and not isAdminCaller)
          return #err("Only seller or admin can finalize");

        switch (l.highestBidder, l.highestBid) {
          case (?winner, ?winBid) {
            // Royalty distribution
            let royaltyAmount : Nat =
              if (itemInfo.royaltyBps > 0)
                (winBid * itemInfo.royaltyBps) / 10_000
              else 0;

            if (royaltyAmount > 0) {
              credit(wallets, itemInfo.creatorPrincipal, royaltyAmount, l.currency);
              recordTx(txs, auditLog, txSeq, #Royalty,
                ?winner, itemInfo.creatorPrincipal,
                royaltyAmount, l.currency, ?l.itemId, null);
            };

            let sellerAmount : Nat = if (winBid >= royaltyAmount) winBid - royaltyAmount else 0;
            credit(wallets, l.sellerPrincipal, sellerAmount, l.currency);
            recordTx(txs, auditLog, txSeq + 1, #Sale,
              ?winner, l.sellerPrincipal,
              sellerAmount, l.currency, ?l.itemId, null);

            addVolume(metrics, winBid);
            listings.add(listingId, { l with active = false });
            upsertMetric(metrics, "salesCompleted");
            #ok winner
          };
          case _ {
            // No bids — just close the listing
            listings.add(listingId, { l with active = false });
            #err("No bids placed; listing closed with no winner")
          };
        }
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // WALLET
  // ═══════════════════════════════════════════════════════════════════

  /// Get wallet balance for caller. Initializes with zeros if not present.
  /// Real blockchain only — never adds fake initial balance.
  public func getMyWallet(wallets : Wallets, caller : Principal) : WalletBalance {
    switch (wallets.get(caller)) {
      case (?w) w;
      case null ({ icp = 0; ckbtc = 0; ckusdc = 0; ckusdt = 0 });
    }
  };

  /// Withdraw funds from wallet. ICP withdrawals require a valid destinationAddress.
  public func withdrawFunds(
    wallets    : Wallets,
    txs        : Transactions,
    auditLog   : AuditLog,
    txSeq      : Nat,
    caller     : Principal,
    amount     : Nat,
    currency   : Text,
    destAddr   : ?Text,
  ) : Result<()> {
    if (amount == 0) return #err("Amount must be greater than zero");

    // ICP withdrawals require a valid destination address
    if (currency == "ICP") {
      let addr = switch destAddr {
        case (?a) a;
        case null return #err("ICP withdrawals require a destination principal address");
      };
      if (not isValidPrincipal(addr))
        return #err("Invalid ICP principal address format");
    };

    if (not debit(wallets, caller, amount, currency))
      return #err("Insufficient balance");

    recordTx(txs, auditLog, txSeq, #Withdrawal,
      ?caller, caller, amount, currency, null, destAddr);
    #ok ()
  };

  // ═══════════════════════════════════════════════════════════════════
  // TRANSACTION QUERIES
  // ═══════════════════════════════════════════════════════════════════

  /// Paginated transactions for a specific principal.
  public func getMyTransactions(
    txs    : Transactions,
    caller : Principal,
    offset : Nat,
    limit  : Nat,
  ) : [Transaction] {
    let all = txs.values()
      .filter(func (tx : Transaction) : Bool {
        (switch (tx.fromPrincipal) { case (?p) p == caller; case null false })
        or tx.toPrincipal == caller
      })
      .toArray();
    let start = Nat.min(offset, all.size());
    let end_  = Nat.min(start + limit, all.size());
    all.sliceToArray(start, end_)
  };

  /// Admin-only full audit log.
  public func getAllTransactions(
    auditLog      : AuditLog,
    isAdminCaller : Bool,
  ) : [AuditLogEntry] {
    if (not isAdminCaller) Runtime.trap("Admin only");
    auditLog.toArray()
  };

  // ═══════════════════════════════════════════════════════════════════
  // DAILY METRICS
  // ═══════════════════════════════════════════════════════════════════

  /// Return today's metrics snapshot. Non-admin callers get today's public summary.
  public func getDailyMetrics(metrics : Metrics) : DailyMetrics {
    let key = todayKey();
    switch (metrics.get(key)) {
      case (?m) m;
      case null {
        { date = key; newUsers = 0; assetsUploaded = 0;
          signedCopiesCreated = 0; salesCompleted = 0; totalTransactionVolume = 0 }
      };
    }
  };

  /// Admin-only: return all stored daily metrics records.
  public func getAllDailyMetrics(
    metrics       : Metrics,
    isAdminCaller : Bool,
  ) : [DailyMetrics] {
    if (not isAdminCaller) Runtime.trap("Admin only");
    metrics.values().toArray()
  };

  /// Persist current in-memory day snapshot (call at end of day / on timer).
  public func recordDailySnapshot(
    metrics             : Metrics,
    newUsersToday       : Nat,
    assetsUploadedToday : Nat,
    signingsTodayCount  : Nat,
  ) {
    let key = todayKey();
    let existing : DailyMetrics = switch (metrics.get(key)) {
      case (?m) m;
      case null {
        { date = key; newUsers = 0; assetsUploaded = 0;
          signedCopiesCreated = 0; salesCompleted = 0; totalTransactionVolume = 0 }
      };
    };
    metrics.add(key, {
      existing with
      newUsers            = newUsersToday;
      assetsUploaded      = assetsUploadedToday;
      signedCopiesCreated = signingsTodayCount;
    })
  };

  // ═══════════════════════════════════════════════════════════════════
  // METRIC INCREMENTS (called from main.mo on relevant events)
  // ═══════════════════════════════════════════════════════════════════

  public func incrementNewUsers(metrics : Metrics) {
    let key = todayKey();
    let m : DailyMetrics = switch (metrics.get(key)) {
      case (?existing) existing;
      case null {
        { date = key; newUsers = 0; assetsUploaded = 0;
          signedCopiesCreated = 0; salesCompleted = 0; totalTransactionVolume = 0 }
      };
    };
    metrics.add(key, { m with newUsers = m.newUsers + 1 })
  };

  public func incrementAssetsUploaded(metrics : Metrics) {
    let key = todayKey();
    let m : DailyMetrics = switch (metrics.get(key)) {
      case (?existing) existing;
      case null {
        { date = key; newUsers = 0; assetsUploaded = 0;
          signedCopiesCreated = 0; salesCompleted = 0; totalTransactionVolume = 0 }
      };
    };
    metrics.add(key, { m with assetsUploaded = m.assetsUploaded + 1 })
  };

  public func incrementSignedCopiesCreated(metrics : Metrics) {
    let key = todayKey();
    let m : DailyMetrics = switch (metrics.get(key)) {
      case (?existing) existing;
      case null {
        { date = key; newUsers = 0; assetsUploaded = 0;
          signedCopiesCreated = 0; salesCompleted = 0; totalTransactionVolume = 0 }
      };
    };
    metrics.add(key, { m with signedCopiesCreated = m.signedCopiesCreated + 1 })
  };

  // ═══════════════════════════════════════════════════════════════════
  // WALLET CREDIT (for deposits from external callers / admin)
  // ═══════════════════════════════════════════════════════════════════

  /// Credit a wallet with a real blockchain deposit. Records in audit log.
  public func depositFunds(
    wallets  : Wallets,
    txs      : Transactions,
    auditLog : AuditLog,
    txSeq    : Nat,
    owner    : Principal,
    amount   : Nat,
    currency : Text,
  ) {
    if (amount == 0) return;
    credit(wallets, owner, amount, currency);
    recordTx(txs, auditLog, txSeq, #Deposit,
      null, owner, amount, currency, null, null);
  };

};
