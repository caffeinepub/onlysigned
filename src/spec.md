# OnlySigned   Digital Asset Signing Platform

## Overview
OnlySigned is a revolutionary platform that ushers in a new era of trustless digital authenticity, where fakes are impossible and every certificate is verifiable on-chain. Creators, celebrities, institutions, and government entities can organize digital assets into collections, sign them to create unique numbered copies, and sell them in an open marketplace with multi-currency support. Collections themselves can also be listed for sale and purchased as complete units. Only signed copies and collections can be traded in the marketplace.

## Features

### Trustless Digital Authenticity
- Revolutionary on-chain certificate verification system ensuring fakes are impossible
- Every certificate is cryptographically verifiable on the blockchain
- Immutable proof of authenticity for all digital assets and signed copies
- Transparent verification process accessible to anyone
- Elimination of counterfeit digital assets through blockchain technology
- Trustless authentication system requiring no central authority for verification

### ICRC-7 NFT Standard Integration
- Each signed copy is implemented as an ICRC-7 compliant NFT for full Internet Computer ecosystem interoperability
- ICRC-7 NFT metadata includes creator information, all signers, asset reference, certificate ID, sequence number, and authenticity hash
- Certificate minting process automatically creates and registers ICRC-7 NFTs with complete metadata
- Enable querying and transferring of signed copy NFTs to other canisters within the IC ecosystem
- Support for external canister listing and validation of OnlySigned NFTs
- Full ICRC-7 standard compliance for maximum interoperability with IC ecosystem tools and marketplaces
- Verification endpoints updated to reflect ICRC-7 token data structure and metadata
- Maintain backward compatibility with existing signed copy functionality while adding ICRC-7 compliance
- Enable external validation of OnlySigned certificates through standard ICRC-7 interfaces
- Support for cross-canister NFT operations and ecosystem integration

### User Profile System
- Automatically assign incremental user number starting from 0 for the first registered user, then incrementing for each subsequent user (0, 1, 2, 3, etc.)
- User number 1 is always assigned admin privileges regardless of registration order
- User registration and authentication with comprehensive profile data
- Profile types: Collector and Certificate Issuer (with subtypes: Celebrity, Government, Institution, etc.)
- Certificate Issuer eligibility requires at least 500 followers (admin exempt from this requirement)
- Enforce uniqueness of both username and display name per principal across the platform
- Username can only be set if the user possesses a UsernameNFT (minted and transferred by admin)
- Display name remains free to set but must be unique per principal
- Automatically create a default AI-generated asset for every new user upon account creation to ensure all users have at least one asset by default
- Profile management with editable fields: username (only if UsernameNFT owned), display name, bio, profile type (Collector/Certificate Issuer), Certificate Issuer subtype, birthdate, email, profile photo, and personal URL
- Profile photo support through image upload or URL input
- Display verified status with checkmark for users with username NFTs
- Display Certificate Issuer status with appropriate badges for different subtypes
- Personal collection display showing owned signed copies and purchased collections
- "My Collectibles" section displaying all signed copies owned by the user with clear ownership information, asset details, and certificate access
- Display username NFTs in user collectibles with special verified designation
- Certificate Issuer profiles displaying their collections and available signed copies with complete profile information
- Upload and signing history for Certificate Issuers
- Collection organization and management interface
- Display owned collections with sale status and pricing information
- Follower count display and tracking for Certificate Issuer eligibility

### User Following System
- Enable users to follow other users through "Follow" button on user profile pages
- Track following and follower relationships for all users
- Display follower count and following count on user profiles
- Show follow status on user profile pages (Follow/Following/Unfollow button states)
- Update follower counts in real-time when users follow or unfollow others
- Use follower count for Certificate Issuer eligibility verification (minimum 500 followers required)
- Display following/follower lists accessible from user profiles
- Enable users to view who they are following and who is following them
- Provide follow/unfollow functionality throughout the platform where user profiles are displayed
- Track follow relationships separately from contact system for broader social networking

### Contact System
- Enable users to follow other users and build contact lists
- Allow users to send contact invitations to other users
- Provide invitation management system where users can accept or decline contact requests
- Display contact lists showing all users who are mutually connected
- Show contact status indicators (following, mutual contact, pending invitation)
- Enable users to search for other users to add to their contact lists
- Provide contact management interface for viewing, organizing, and removing contacts
- Track mutual contact relationships where both users have accepted each other's invitations
- Display contact counts and connection status in user profiles
- Enable contact discovery through user search and recommendations
- Track follower counts for Certificate Issuer eligibility verification

### Private Asset Sharing System
- Allow users to share private assets with selected contacts from their contact list
- Provide asset sharing interface where users can select specific contacts to grant access
- Enable temporary or permanent sharing permissions for private assets
- Track sharing permissions and access history for each private asset
- Display shared assets in recipients' interfaces with clear indication of shared status
- Allow asset owners to revoke sharing permissions at any time
- Show sharing status and recipient lists in asset management interfaces
- Ensure shared private assets remain private and are only accessible to selected contacts
- Provide notifications when assets are shared with users
- Enable bulk sharing of multiple assets to selected contacts
- Respect existing privacy controls while enabling selective sharing with trusted contacts

### Private Chat System
- Enable private messaging between users who are mutually in each other's contact lists
- Provide secure chat interface accessible only to users with mutual contact relationships
- Ensure all messages are private and encrypted, accessible only to chat participants
- Display chat history and conversation threads for each contact relationship
- Enable real-time messaging with message delivery and read status indicators
- Provide chat notifications for new messages from contacts
- Allow users to send text messages, links, and references to assets or collections
- Enable message search and conversation history management
- Provide chat settings for managing notifications and privacy preferences
- Ensure chat functionality is mobile-friendly and responsive
- Display active chat indicators and online status for contacts
- Enable message deletion and conversation management features

### Support System
- Provide support form accessible to all users for submitting feedback, bug reports, and product enhancement suggestions
- Include form fields for subject, message, and optional contact email
- Send form submissions as email to support@onlysigned.com
- Provide confirmation message to users after successful form submission
- Display support form in easily accessible location within the application
- Validate form inputs and provide clear error messages for incomplete submissions
- Track support form submissions for administrative purposes

### Certificate Issuer System
- Support for multiple types of Certificate Issuers: celebrities, institutions, and government entities
- Enable institutions and government entities to register and be verified as Certificate Issuers
- Allow admin users to verify and assign Certificate Issuer status to accounts
- Enforce 500 follower minimum requirement for Certificate Issuer eligibility (admin exempt)
- Display appropriate visual indicators (badges or tags) for different types of Certificate Issuers throughout the platform
- Show Certificate Issuer type in asset listings, certificates, profile pages, and signed copy details
- Maintain Certificate Issuer verification status and type information in user profiles
- Provide onboarding flows specifically designed for institutions and government entities
- Enable Certificate Issuer management through admin dashboard with verification controls
- Validate follower count before allowing certificate issuance operations

### Public User Landing Pages
- Provide public landing profile page for every user accessible via unique URL
- Display user's public profile information including display name, bio, profile photo, verified status, and Certificate Issuer status
- Show only assets, signed copies, and collections that the user has marked as public in an organized display
- Include public collections owned by the user with their contents
- Display username NFTs with special verified designation on public profiles
- Display Certificate Issuer badges for different subtypes on public profiles
- Make public profiles accessible from user search results and profile links throughout the platform
- Ensure public profiles are viewable by all users without authentication requirements
- Show admin badge for admin users on their public landing pages
- Display follower count and Certificate Issuer eligibility status on public profiles
- Display follow/unfollow button on public profile pages for user interaction
- Show following count and follower count on public profiles
- Respect privacy settings so only public items are visible to other users while owners can see all their own items
- Make all references clickable: usernames redirect to user public profiles, assets redirect to asset detail pages, collections redirect to collection detail pages
- Provide comprehensive navigation between related entities through clickable references

### User Explorer Feature
- Provide "User Explorer" functionality allowing users to search all existing users with comprehensive search capabilities
- Display latest active users by default when User Explorer page is accessed
- Show user cards with profile information that are clickable and link directly to public profile pages
- Enable search by display name, username, user number, or any combination of search criteria
- Implement advanced filtering system with multiple filter options:
  - Verified users (users with username NFTs)
  - Admin users (users with admin status)
  - Collector users (users with Collector profile type)
  - Certificate Issuer users (users with Certificate Issuer profile type)
  - Filter by Certificate Issuer subtype (celebrity, government, institution)
  - Filter by follower count ranges for Certificate Issuer eligibility
  - Filter by user registration date ranges
  - Filter by activity level or recent activity
- Display search results with user profile information, verification status, admin badges, profile type indicators, and Certificate Issuer badges
- Make usernames in search results clickable, linking directly to user's public profile landing pages
- Show user statistics in search results (number of collections, signed copies, follower count, etc.)
- Provide sorting options for search results (by user number, registration date, activity, follower count, etc.)
- Enable users to browse and discover other users on the platform with enhanced filtering capabilities
- Include pagination for large search result sets
- Provide clear indication when no users match the search criteria
- Link search results directly to public profile landing pages with full navigation support
- Display latest active users as default view with user activity indicators

### Privacy Controls
- Add privacy settings for all assets, signed copies, and collections with public/private toggle options
- Default all new assets, signed copies, and collections to private visibility
- Allow users to configure each item individually as public or private
- Include privacy toggle controls in asset creation and editing forms
- Include privacy toggle controls in signed copy creation and editing interfaces
- Include privacy toggle controls in collection creation and editing forms
- Display privacy status indicators in user's own asset, signed copy, and collection management interfaces
- Ensure privacy settings are enforced so only public items appear on public profile pages and in User Explorer results
- Allow owners to view all their own items (both public and private) in their personal interfaces

### Admin Account Management
- Designate user number 1 as the admin account with elevated privileges
- Admin status is determined by the isAdmin field in the user profile, not solely by userNumber
- Clearly tag and visually distinguish admin accounts throughout the UI as "Admin"
- Display admin status in user lists, asset signatures, Certificate Issuer profiles, and username displays
- Show admin badge or indicator wherever admin users appear in the interface
- Maintain admin account identification across all user interactions and displays
- Admin is exempt from 500 follower requirement for certificate issuance
- Enable admin role reassignment to the currently connected user's principal to restore full admin access
- Provide admin role reassignment functionality that updates the AccessControl state and cached admin references
- Ensure immediate availability of admin privileges after role reassignment including admin badge display and management tools access

### Admin Dashboard
- Provide exclusive "Admin Dashboard" section accessible only to users with admin status (isAdmin === true)
- Display comprehensive user statistics including total users, active users, and registration trends
- Show recent activity feed with user actions, transactions, and platform events
- Provide searchable and manageable user list with filtering and sorting capabilities
- Enable admin to view detailed user profiles and activity history including new profile fields
- Allow admin to edit user profiles including display name, bio, profile type, Certificate Issuer subtype, birthdate, email, profile photo, and personal URL
- Enable admin to manage user roles and permissions from the dashboard
- Allow admin to verify and assign Certificate Issuer status to accounts
- Provide Certificate Issuer management interface for reviewing and approving applications
- Display Certificate Issuer verification requests and status management tools
- Provide admin-specific navigation and interface elements clearly separated from regular user features
- Display admin status prominently throughout the dashboard interface
- Display the live canister ID prominently in the Admin Dashboard section with comprehensive canister ID detection system using all available sources including actor._canisterId, VITE_BACKEND_CANISTER_ID, VITE_CANISTER_ID_BACKEND, window.ic, and any other runtime or environment variables
- Implement multiple canister ID detection methods with priority order: actor._canisterId first, then environment variables (VITE_BACKEND_CANISTER_ID, VITE_CANISTER_ID_BACKEND), then window.ic object, then IC agent information, and deployment metadata
- Provide enhanced debug output showing all attempted detection methods, their results, and which method successfully retrieved the canister ID
- Display comprehensive troubleshooting information when canister ID cannot be determined, including step-by-step manual retrieval instructions from dfx.json, deployment logs, or IC dashboard
- Ensure canister ID detection works reliably in both local development and production environments with environment-specific detection strategies
- Provide clear error messages with actionable solutions when automatic detection fails, including specific file paths and commands for manual retrieval
- Display detection method used and confidence level for successful canister ID retrieval with detailed diagnostic information
- Include copy-to-clipboard functionality with confirmation feedback for easy DNS configuration
- Show canister ID refresh capability with real-time detection retry functionality and manual override option
- Display comprehensive error messages with troubleshooting steps, file locations, and contact information for technical support
- Provide fallback instructions for DNS configuration when automatic detection fails with specific examples
- Display the current cycles balance of the backend canister in the Admin Dashboard, updating in real time or on refresh
- Provide "Marketplace Transactions Audit Log" viewer allowing admins to review a chronological list of all marketplace transactions (sales, purchases, offers, transfers) with details such as transaction type, involved users, asset/copy/collection IDs, price, currency, and timestamp
- Display daily metrics including number of new users, assets uploaded, signed copies created, sales completed, and total transaction volume for the current and previous days
- Display support form submissions log for admin review and management
- Include admin role reassignment functionality accessible from the Admin Dashboard to restore admin access to the currently connected user

### Username NFT Management System
- Enable any user with admin status (isAdmin === true) to mint unique username NFTs for any provided username and principal address
- Allow admin users to sign username NFTs creating verified digital certificates
- Provide comprehensive username NFT management interface in admin dashboard for viewing all minted username NFTs
- Display complete list of all username NFTs with ownership information, minting date, and current status
- Enable admin users to view current ownership of all username NFTs across the platform
- Allow admin users to transfer username NFTs between any users through the admin dashboard
- Provide username NFT transfer interface with user selection and confirmation
- Track all username NFT transfers including admin-initiated transfers with full history
- Automatically mark users with username NFTs as "verified" with checkmark indicator
- Display verified status throughout the platform wherever usernames appear
- Track username NFT ownership and verification status in user profiles
- Show username NFT certificates in user collectibles with special verified designation
- Provide clear success and failure feedback for username NFT minting and transfer operations
- Display minting and transfer status messages with error handling for failed operations
- Provide clear feedback if a user lacks admin rights when attempting username NFT operations
- Enforce that users can only set a username if they possess a UsernameNFT
- Validate username ownership before allowing username changes in profile management

### Username NFT Purchase Offer System
- Allow any user to search for available username NFTs and view their current ownership status
- When a username NFT is not found during search, display a clear offer submission form allowing users to submit purchase offers for that unavailable username
- Enable users to submit purchase offers for both existing and non-existent username NFTs with specified offer amounts in supported currencies
- Display username NFT search interface with filtering and availability status, including clear indication when usernames are not found
- Provide prominent offer submission form with amount input and currency selection that appears when a username is unavailable
- Track all submitted offers with user information, offer amount, currency, timestamp, and target username
- Display user's submitted offers in their profile with status tracking (pending, accepted, rejected)
- Show offer history and status updates for users who have submitted username NFT purchase offers
- Store offers for both existing username NFTs and requests for new username NFTs to be minted

### Admin Username NFT Offer Management
- Provide admin interface to view all pending username NFT purchase offers including offers for non-existent usernames
- Display comprehensive offer information including username, offering user, amount, currency, submission date, and whether the username NFT currently exists
- Enable admin users to accept or reject username NFT purchase offers for both existing and non-existent usernames
- When admin accepts an offer for an existing username NFT, automatically transfer the username NFT to the offering user
- When admin accepts an offer for a non-existent username, automatically mint the username NFT and assign it to the offering user
- Process payment from the offering user's wallet to admin upon offer acceptance for both existing and new username NFTs
- Update username NFT ownership records and grant verified status to new owner upon successful transfer or minting
- Provide clear confirmation and status updates for offer acceptance and rejection actions
- Track offer resolution history with admin actions and timestamps
- Display offer management interface within the admin dashboard with filtering and sorting options
- Show offer status updates and transfer/minting confirmations in admin interface
- Distinguish between offers for existing username NFTs and requests for new username NFTs in the admin interface

### Admin Asset Transfer System
- Enable any user with admin status (isAdmin === true) to transfer special admin-signed NFTs to any user
- Provide admin interface for selecting recipients and transferring digital assets
- Track admin-initiated transfers separately from regular marketplace transactions
- Display admin-transferred assets with special designation in user collections
- Maintain transfer history and provenance for admin-distributed assets

### Collection Management
- Allow Certificate Issuers to create, edit, and delete named collections
- Each Certificate Issuer can manage multiple collections
- Collections serve as organizational containers for related assets
- Display collections on Certificate Issuer profiles
- Enable Certificate Issuers to assign assets to specific collections with proper collection selection UI that uses collection IDs as values
- Allow Certificate Issuers to list entire collections for sale with price and currency settings, including zero price for free collections
- Support collection sales through direct purchase and auction methods
- Transfer collection ownership and all contained assets when collections are sold
- Include privacy controls for collections with public/private toggle (default to private)
- Respect privacy settings in collection display and public profile visibility
- Provide collection detail pages accessible via clickable collection references throughout the platform
- Enable navigation from collection pages to Certificate Issuer profiles and contained assets

### Digital Asset Management
- Allow Certificate Issuers to upload multiple files per asset (images, audio, documents, videos)
- Support multiple file formats and sizes for each asset
- Enable Certificate Issuers to edit asset properties: name, base price (including zero for free assets), royalty settings, and privacy settings
- Store uploaded assets securely within collections
- Display assets with metadata and attached files
- Allow Certificate Issuers to manage their asset library within collections
- Provide collection assignment interface with Select component that uses collection unique IDs as values (never empty strings for real collections)
- Ensure Select component value is set to undefined or null when no collection is selected, never an empty string
- Validate that all Select.Item components have valid, non-empty value props for collection selection
- Original assets cannot be listed for sale directly - only signed copies can be traded
- Include privacy controls for assets with public/private toggle (default to private)
- Respect privacy settings in asset display and public profile visibility
- Provide asset detail pages accessible via clickable asset references throughout the platform
- Enable navigation from asset pages to Certificate Issuer profiles and associated collections

### Digital Asset Signing and Certificate Validation
- Enable Certificate Issuers to sign assets they own, generating unique numbered signed copies as ICRC-7 compliant NFTs
- Enforce 500 follower minimum requirement before allowing certificate issuance (admin exempt)
- Each signed copy receives a unique sequence number (e.g., #1, #2, #3) and is minted as an ICRC-7 NFT with complete metadata
- Generate unique, shareable URLs for each signed copy to enable easy sharing and direct access
- Allow Certificate Issuers to set individual prices for each signed copy, independent of the asset's base price, including zero price for free signed copies
- Create visible certificates of ownership for each signed copy with verifiable Certificate Issuer signatures and ICRC-7 compliance
- Display Certificate Issuer type (celebrity, institution, government) prominently in certificates and signed copy details
- Display unique shareable URL for each signed copy on its detail page and certificate modal
- Provide "Copy Link" button for easy URL sharing on signed copy detail pages and certificate modals
- Implement certificate validation service allowing anyone to verify the authenticity and signature of any signed copy by entering its certificate ID or visiting its unique URL, using ICRC-7 token data
- Ensure certificate validation confirms that only the original Certificate Issuer could have signed the copy through ICRC-7 metadata verification
- Display Certificate Issuer type and verification status in certificate validation results
- Generate cryptographic signatures for each signed copy that can be independently verified through ICRC-7 standard interfaces
- Display certificate information with verifiable Certificate Issuer signature on every signed copy
- Track the total number of signed copies for each asset
- Display signature information and Certificate Issuer verification with admin status and Certificate Issuer type clearly indicated
- Only signed copies can be listed for sale in the marketplace
- Each signed copy is independently owned and can have different owners
- Signed copies can be transferred individually to different buyers
- Include privacy controls for signed copies with public/private toggle (default to private)
- Respect privacy settings in signed copy display and public profile visibility
- Make all references in certificates clickable: Certificate Issuer names redirect to profiles, asset names redirect to asset detail pages
- Provide comprehensive certificate validation interface accessible to all users for verifying signed copy authenticity using ICRC-7 token data
- Enable certificate validation by both certificate ID input and direct URL access
- Link certificate validation results to Certificate Issuer and asset detail pages for easy verification and navigation

### Multi-Signer Co-Signing System
- Enable asset owners to invite other users to co-sign existing signed copies, allowing multiple signers per signed copy with ICRC-7 metadata updates
- Provide "Invite to Sign" action for asset owners on each signed copy they own
- Allow invited users to sign the copy even if they do not meet the usual Certificate Issuer eligibility requirements (500 followers)
- Update signed copy data model to support multiple signers with their individual signatures and information in ICRC-7 metadata
- Display all signers clearly on signed copy detail pages and certificate displays
- Include all signer information in certificates and download packages for complete authenticity verification
- Track invitation status (pending, accepted, declined) for co-signing invitations
- Provide user interface for selecting and inviting users to co-sign signed copies
- Display co-signing invitations in user interfaces for invited users to accept or decline
- Update certificate validation to verify all signatures from multiple signers using ICRC-7 token metadata
- Ensure all co-signers are properly credited and displayed in signed copy ownership and certificate information
- Maintain signing history and provenance for multi-signer signed copies
- Enable navigation from co-signer names to their public profiles in certificates and signed copy details

### Signed Copy Download System
- Provide secure backend endpoint for downloading signed copies that validates user ownership before allowing download
- Generate downloadable package containing both the asset file(s) and embedded certificate data with cryptographic proof of authenticity
- Include manifest or metadata file in the download package with certificate information, asset hash, unique copy ID, ICRC-7 token data, and all signer information for later authenticity verification
- Provide "Download" button for each signed copy in the user interface that calls the secure backend endpoint
- Enable users to download signed copies they own as a complete package with tamper-evident proof of authenticity
- Embed certificate data, unique copy identifier, ICRC-7 token metadata, and all co-signer information directly into the downloadable package
- Display download status and progress indicators during package preparation and download
- Support downloading of all file types associated with the signed copy (images, audio, documents, videos)
- Maintain download history and tracking for each signed copy
- Ensure downloaded packages contain verifiable proof of authenticity and ownership from all signers
- Package both asset content and certificate as a unified downloadable bundle with complete multi-signer information and ICRC-7 compliance data
- Make download feature available and functional for all owned signed copies
- Provide seamless download experience with proper error handling and user feedback

### Collection Sales
- Enable Certificate Issuers to list entire collections for sale with chosen price and currency, including zero price for free collections
- Support multiple sale methods for collections: direct purchase and auction
- Support multiple currencies for collection sales: ICP, ckBTC, ckUSDC, and ckUSDT
- Allow buyers to purchase or bid on entire collections using wallet funds, including free collections
- Transfer ownership of collections and all contained assets to buyers upon successful purchase
- Add purchased collections to buyer's profile
- Display collection sale information including price, currency, and sale method
- Show collection ownership history and provenance

### Marketplace
- Open marketplace for buying and selling signed copies and collections only
- Original assets cannot be listed or sold in the marketplace
- Each signed copy is sold individually - no bulk or grouped sales of signed copies
- Support multiple sale methods: direct purchase and auction
- Support multiple currencies: ICP, ckBTC, ckUSDC, and ckUSDT
- Allow Certificate Issuers to list signed copies and collections with chosen sale method and currency, including zero price for free items
- Enable buyers to purchase or bid on signed copies and collections using wallet funds, including free items
- Provide "Buy" button for each listed signed copy enabling direct purchase, including free items
- Process atomic payment transfer from buyer's wallet to seller's wallet before transferring ownership (skip payment for zero-price items)
- Calculate and distribute royalties to the original Certificate Issuer on every signed copy sale, including both direct purchase and auction methods, for all supported currencies
- Deduct royalty amount from seller's payment and transfer to Certificate Issuer wallet automatically
- Validate buyer's wallet balance before allowing purchase and provide clear feedback if insufficient funds (not required for zero-price items)
- Transfer ownership of individual signed copies to buyers upon successful sale
- Add purchased items to buyer's collection
- Display signed copy and collection details, signature information, Certificate Issuer type, pricing, and sale method
- Show ownership history and provenance
- Provide filtering and sorting options by currency, sale method, and item type (signed copies vs collections)

### User Profiles and Collections
- User registration and authentication with incremental user number assignment starting from 0
- Profile management with editable fields: username (only if UsernameNFT owned), display name, bio, profile type (Collector/Certificate Issuer), Certificate Issuer subtype, birthdate, email, profile photo, and personal URL
- Enforce uniqueness of both username and display name per principal
- Profile photo management through image upload or URL input
- Display verified status with checkmark for users with username NFTs
- Display Certificate Issuer status with appropriate badges for different subtypes
- Personal collection display showing owned signed copies and purchased collections
- "My Collectibles" section displaying all signed copies owned by the user with clear ownership information, asset details, and certificate access
- Display username NFTs in user collectibles with special verified designation
- Certificate Issuer profiles displaying their collections and available signed copies with complete profile information
- Upload and signing history for Certificate Issuers
- Collection organization and management interface
- Display owned collections with sale status and pricing information
- Follower count display and Certificate Issuer eligibility status
- Following count display showing how many users the current user is following
- Follow/unfollow functionality on user profiles with real-time count updates

### Navigation and Menu Structure
- Main menu organized into primary sections: "Marketplace", "Collectibles", "User Explorer", "Contacts", "Support", and "Profile/Wallet"
- "Marketplace" section for browsing and purchasing signed copies and collections
- "Collectibles" section containing:
  - "Collections" sub-section for managing user's collections
  - "Asset Upload" sub-section for uploading new assets (Certificate Issuers only with follower requirement)
  - "My Collectibles" page for viewing owned signed copies
  - "Username NFTs" page for searching available username NFTs and submitting purchase offers
- "User Explorer" section for searching and discovering other users with advanced filtering and direct links to public profiles, displaying latest active users by default
- "Contacts" section containing:
  - "My Contacts" page for managing contact lists and relationships
  - "Contact Invitations" page for managing sent and received invitations
  - "Messages" page for private chat functionality with contacts
- "Support" section containing support form for submitting feedback, bug reports, and enhancement suggestions
- "Profile/Wallet" section containing:
  - User profile management and settings
  - Wallet functionality with balance management and transactions
  - Personal account information and preferences
- "Admin Dashboard" section (admin status only) containing:
  - User statistics and analytics
  - User management and search interface
  - Username NFT management and transfer tools with comprehensive ownership tracking
  - Username NFT minting and assignment tools with clear success/failure feedback
  - Username NFT purchase offer management interface for viewing and processing offers
  - Admin asset transfer interface
  - Certificate Issuer verification and management tools
  - Live canister ID display with comprehensive detection system using all available sources, enhanced debugging output, and troubleshooting instructions for manual retrieval
  - Current cycles balance display with real-time or refresh-based updates
  - Marketplace Transactions Audit Log viewer for reviewing all marketplace transactions chronologically
  - Daily metrics display showing new users, assets uploaded, signed copies created, sales completed, and total transaction volume for current and previous days
  - Support form submissions log for admin review and management
  - Admin role reassignment functionality to restore admin access to the currently connected user
- Clear navigation structure with section-based organization and admin-specific elements
- Intuitive menu layout for easy access to core functionality with admin privileges clearly separated
- Certificate validation service accessible from signed copy detail pages and marketplace listings

### Wallet System
- Integrated wallet section in user profiles
- Support for depositing supported tokens: ICP, ckBTC, ckUSDC, and ckUSDT through real blockchain transactions only
- Support for withdrawing funds in all supported currencies: ICP, ckBTC, ckUSDC, and ckUSDT
- Display wallet balances for all supported currencies based on real blockchain activity
- Enable users to spend wallet funds to purchase signed copies and collections
- Enable users to withdraw any amount of their available balance in supported currencies
- For ICP withdrawals, allow users to specify a destination ICP principal address
- Provide withdrawal form with principal address input field for ICP withdrawals
- Validate principal address format and provide clear feedback for invalid addresses
- Process payments from wallet balances during marketplace transactions (skip payment for zero-price items)
- Process withdrawal requests, deducting withdrawn amounts from user wallets
- Record withdrawal requests with destination principal addresses for ICP withdrawals
- Simulate or process transfers to specified principal addresses within Internet Computer constraints
- Track wallet transaction history and balance changes including withdrawals with destination addresses
- Validate wallet balance before purchases and withdrawals, providing clear error messages for insufficient funds (not required for zero-price items)
- Remove fake ICP deposit logic - all wallet balances and transactions must be based on real blockchain activity only
- Provide withdrawal confirmation and error handling for failed withdrawal attempts
- Display transaction status feedback for withdrawal operations
- Receive royalty payments automatically when signed copies are sold
- Process username NFT purchase offer payments when offers are accepted by admin

### Ownership and Transfers
- Track ownership of individual signed copies and collections
- Handle ownership transfers when sales are completed for both individual items and collections
- Process atomic payment transfers from buyer to seller wallet before ownership transfer (skip payment for zero-price items)
- Calculate and distribute royalties to original Certificate Issuers during signed copy sales
- Maintain ownership history and provenance records for each signed copy
- Add purchased items and collections to buyer's personal profile
- Display clear ownership information and certificates
- Transfer all assets within a collection when collection ownership changes
- Process wallet-based payments and update balances upon successful purchases (skip payment for zero-price items)
- Ensure payment and ownership transfer operations are atomic to prevent inconsistent states
- Support individual signed copy ownership where each copy can have a different owner
- Handle admin-initiated asset transfers with proper ownership updates and tracking
- Process username NFT ownership transfers when purchase offers are accepted
- Update verified status for users who receive username NFTs through purchase offers
- Handle username NFT minting and assignment when offers for non-existent usernames are accepted

### Domain Verification and DNS Configuration
- Provide `.well-known` endpoint accessible from both `https://onlysigned.com/.well-known` and `https://onlysigned-3nt.caffeine.xyz/.well-known`
- Return the correct domain verification text string `"domain-verification=onlysigned.com"` from both domain endpoints
- Ensure both routes consistently return the same verification content for external verifiers
- Maintain SSL compatibility and proper response formatting for domain verification
- Enable domain verification for DNS providers and third-party services
- Support standard domain verification methods and protocols
- Ensure proper domain ownership validation capabilities

### PDF Pitch Deck Generation
- Generate professionally formatted PDF pitch deck for OnlySigned with modern, clean design
- Include 5 pages with specific content structure:
  1. Introduction & Vision page featuring OnlySigned logo and hero banner with trustless digital authenticity messaging
  2. How It Works page showcasing asset detail and marketplace functionality
  3. Web3 Innovation & User Empowerment page highlighting certificate validation, wallet system, and royalty distribution with emphasis on impossible fakes and on-chain verification
  4. Social & Community Features page displaying username NFT system, public profiles, and user explorer functionality
  5. Why OnlySigned is a Web3 Revolution page featuring admin dashboard, verification system, and shareable URL capabilities with trustless authenticity messaging
- Use branding and color palette consistent with the application design
- Include relevant images from the asset library for each section to enhance visual presentation
- Format content in professional pitch deck style with clear headings, bullet points, and visual elements
- Ensure PDF is suitable for business presentations and investor meetings
- Maintain English language throughout the pitch deck content
- Emphasize OnlySigned's revolutionary approach to eliminating fakes through blockchain verification

### Privacy Policy and Legal Compliance
- Provide comprehensive Privacy Policy page accessible to all users
- Explicitly state compliance with international privacy laws including GDPR, US privacy regulations, and other relevant global privacy standards
- Clearly explain that all user data is encrypted and secured using industry-standard encryption methods
- Detail that only public information marked by users is accessible to others on the platform
- Emphasize that private assets, signed copies, and collections are encrypted and viewable only by their owner
- Include statement that admin users have no access to private user data or assets, reinforcing user privacy and security
- Explain the platform's commitment to trustless authentication and fake document detection
- Cover user rights including data access, modification, deletion, and portability rights under applicable privacy laws
- Detail data protection measures including encryption, secure storage, and access controls
- Explain data collection practices, usage purposes, and retention policies
- Provide information about user consent mechanisms and opt-out procedures
- Include contact information for privacy-related inquiries and data protection officer details
- Ensure privacy policy is easily accessible from main navigation and footer
- Regular updates to privacy policy with user notification mechanisms
- Clear explanation of how privacy settings work and their enforcement throughout the platform
- Explicitly state that OnlySigned does not use or sell user data to third parties
- Clearly state that OnlySigned has a zero advertisement policy and does not display any advertisements
- Explain that all platform revenue is generated solely through voluntary donations and transaction fees to maintain the service
- Emphasize complete transparency in revenue model and data handling practices
- Provide clear information about how transaction fees are used exclusively for platform maintenance and improvement
- State that user data is never monetized, shared, or sold for any commercial purposes
- Highlight the platform's commitment to user privacy and data protection as core values
- Clearly state that all transactions are conducted in cryptocurrencies (Bitcoin, Ethereum, and ICP tokens)
- Specify that users are solely responsible for their funds and identity protection
- Add disclaimer that OnlySigned cannot be held responsible for user funds, as all funds are managed on the blockchain and users must secure their wallets and private keys
- Specify that if a user loses their private keys, only the username NFT can be recovered by the admin, not any other funds or assets
- Include comprehensive cryptocurrency transaction disclaimers and user responsibility statements

## Backend Requirements
- Refactor the backend codebase into smaller, modular Motoko files to optimize build speed and maintainability while preserving all existing functionality
- Organize backend code into logical modules with clear separation of concerns
- Create separate modules for user management, asset management, collection management, marketplace operations, wallet functionality, and admin operations
- Maintain all current features and business logic while improving code organization and build performance
- Implement ICRC-7 NFT standard compliance for all signed copies with complete metadata support
- Create ICRC-7 NFT tokens for each signed copy with metadata including creator, all signers, asset reference, certificate ID, sequence number, and authenticity hash
- Integrate ICRC-7 NFT creation into certificate minting process so certificates are automatically registered as ICRC-7 compliant tokens
- Provide ICRC-7 standard interfaces for querying and transferring signed copy NFTs to enable interoperability with other IC ecosystem canisters
- Update verification endpoints to use ICRC-7 token data structure and metadata for certificate validation
- Maintain backward compatibility with existing signed copy functionality while adding ICRC-7 compliance
- Enable external canisters to query and validate OnlySigned NFTs through standard ICRC-7 interfaces
- Support cross-canister NFT operations and ecosystem integration through ICRC-7 compliance
- Store user accounts and authentication data with userNumber-based admin account designation and incremental user number assignment starting from 0
- Ensure user number 1 is always assigned admin privileges regardless of registration order
- Automatically create a default AI-generated asset for every new user upon account creation to ensure all users have at least one asset by default
- Store comprehensive user profile information including username, display name, bio, profile type (Collector/Certificate Issuer), Certificate Issuer subtype, admin status (isAdmin field), verified status, birthdate, email, profile photo, and personal URL
- Enforce uniqueness of both username and display name per principal across the platform
- Validate that username can only be set if the user possesses a UsernameNFT
- Track follower counts for each user to determine Certificate Issuer eligibility
- Implement user following system with follow/unfollow functionality and follower/following count tracking
- Store following relationships between users with follow status and timestamps
- Update follower counts in real-time when users follow or unfollow others
- Provide endpoints for follow/unfollow operations and follower/following list retrieval
- Track user activity for displaying latest active users in User Explorer
- Enforce 500 follower minimum requirement for Certificate Issuer status and certificate issuance (admin exempt)
- Validate follower count before allowing certificate issuance operations
- Implement contact system with user following, invitation management, and mutual contact tracking
- Store contact relationships, invitation status (pending, accepted, declined), and mutual contact verification
- Enable contact invitation sending, acceptance, and decline functionality with proper status tracking
- Store contact lists and relationship data for each user with mutual contact identification
- Track follower counts based on contact relationships and following status
- Implement private asset sharing system with permission management and access control
- Store asset sharing permissions linking private assets to specific contacts with access tracking
- Enable temporary and permanent sharing permissions with revocation capabilities
- Track sharing history and access logs for each private asset
- Implement private chat system for users with mutual contact relationships
- Store encrypted chat messages between users with proper access control
- Enable real-time messaging with message delivery status and read receipts
- Store chat conversation history and thread management data
- Ensure chat messages are encrypted and accessible only to participants
- Implement support form system for collecting user feedback, bug reports, and enhancement suggestions
- Store support form submissions with subject, message, optional contact email, and timestamp
- Process support form submissions and send emails to support@onlysigned.com
- Track support form submission status and provide confirmation to users
- Validate support form inputs and handle submission errors appropriately
- Implement Certificate Issuer system with support for different subtypes
- Store Certificate Issuer verification status and subtype information (celebrity, institution, government)
- Enable admin users to verify and assign Certificate Issuer status to accounts
- Implement admin role identification based on isAdmin field in user profile
- Implement automatic incremental user number assignment at registration starting from 0 for the first user
- Store username NFT data with comprehensive ownership tracking, minting history, and transfer records
- Enable username NFT minting for any provided username and principal address by any user with admin status (isAdmin === true)
- Provide robust username NFT minting functionality with proper error handling and success confirmation
- Store all username NFT ownership data with complete transfer history and current ownership status
- Enable username NFT transfers between any users by admin users with full tracking and history
- Validate admin status based on isAdmin field before allowing username NFT operations and provide appropriate error responses for non-admin users
- Validate username ownership before allowing username changes in profile management
- Store username NFT purchase offers with user information, offer amount, currency, timestamp, target username, and status
- Track whether username NFT purchase offers are for existing username NFTs or requests for new username NFTs to be minted
- Track offer status (pending, accepted, rejected) and resolution history with admin actions
- Process username NFT purchase offer acceptance with automatic ownership transfer for existing NFTs or minting and assignment for new NFTs
- Process payment handling for both existing username NFT transfers and new username NFT minting when offers are accepted
- Validate wallet balance before processing username NFT purchase offers and provide appropriate error handling
- Store admin dashboard analytics data including user statistics and activity logs
- Store collection data with names, Certificate Issuer associations, sale status, pricing (including zero prices), currency information, and privacy settings
- Store digital assets with multiple file attachments per asset and privacy settings
- Track asset properties: name, base price (including zero prices), royalty settings, collection assignment, and privacy settings (public/private with default to private)
- Store signed copy data with unique sequence numbers, individual pricing (including zero prices), individual ownership, privacy settings, Certificate Issuer type information, and cryptographic signatures for certificate validation
- Update signed copy data model to support multiple signers with individual signatures and signer information in ICRC-7 metadata
- Store co-signing invitation data with invitation status (pending, accepted, declined) and invited user information
- Track all signers for each signed copy with their individual signatures and signing timestamps in ICRC-7 token metadata
- Enable invited users to sign copies even without meeting usual Certificate Issuer eligibility requirements
- Store multi-signer certificate data with all signer information for complete authenticity verification in ICRC-7 format
- Implement co-signing invitation system allowing asset owners to invite other users to co-sign signed copies
- Provide endpoints for sending co-signing invitations, accepting/declining invitations, and processing co-signing actions
- Track invitation history and status for all co-signing invitations with proper state management
- Validate asset ownership before allowing co-signing invitations to be sent
- Enable invited users to sign copies regardless of their Certificate Issuer eligibility status
- Update signed copy ownership and certificate data when co-signing is completed with ICRC-7 metadata updates
- Generate unique, shareable URLs for each signed copy and store URL mapping data
- Generate and store verifiable cryptographic signatures for each signed copy that can be independently validated through ICRC-7 interfaces
- Implement certificate validation system that can verify the authenticity of any signed copy by certificate ID or unique URL and confirm all signers' authenticity using ICRC-7 token data
- Store certificate validation data and provide API endpoints for certificate verification by ID or URL with multi-signer support using ICRC-7 metadata
- Store Certificate Issuer type information in signed copy certificates and validation results
- Maintain ownership records and transfer history for individual signed copies and collections
- Store marketplace listings for signed copies and collections only (not original assets) with sale method (direct/auction) and currency data, including zero-price listings
- Handle multi-currency wallet system with deposit, spending, and withdrawal functionality based on real blockchain transactions only
- Remove fake ICP deposit logic - implement real blockchain-based wallet balance tracking and transaction processing
- Store wallet balances for each user across all supported currencies based on real blockchain activity
- Process wallet-based transactions and auction bidding for collections and signed copies, including zero-price items
- Calculate royalty amounts based on asset royalty settings for signed copy sales
- Process royalty distribution to original Certificate Issuers during signed copy sales for all currencies and sale methods
- Update Certificate Issuer wallet balances with royalty payments automatically
- Process withdrawal requests with balance validation and deduction from user wallets
- Store withdrawal requests with destination principal addresses for ICP withdrawals
- Validate ICP principal address format for withdrawal requests
- Simulate or process ICP transfers to specified principal addresses within Internet Computer constraints
- Implement atomic payment transfer operations from buyer to seller wallet (skip payment for zero-price items)
- Validate wallet balances before processing purchases and withdrawals (not required for zero-price items)
- Process ownership transfers upon successful sales including individual signed copy transfers
- Update wallet balances when purchases are made and withdrawals are processed (no balance changes for zero-price items)
- Ensure payment and ownership transfer operations are atomic and consistent
- Remove automatic wallet initialization with fake ICP - implement real blockchain-based wallet initialization
- Track wallet initialization status to prevent duplicate credits
- Accept and validate zero as a valid price value in all price-related operations
- Store admin-initiated asset transfers with proper tracking and provenance
- Track isAdmin field-based admin identification and status management
- Store public profile data for all users accessible via unique URLs
- Enforce privacy settings so only public assets, signed copies, and collections are visible to other users
- Allow owners to access all their own items regardless of privacy settings
- Store privacy settings for all assets, signed copies, and collections with default to private
- Store Certificate Issuer verification requests and status management data
- Implement comprehensive canister ID detection and storage system with multiple detection methods using all available sources including actor._canisterId, VITE_BACKEND_CANISTER_ID, VITE_CANISTER_ID_BACKEND, window.ic, and any other runtime or environment variables
- Store canister ID information with priority-based detection order and fallback mechanisms for reliable retrieval in all deployment scenarios
- Provide comprehensive canister ID debugging system with detailed logging of all attempted detection methods, their results, success/failure status, and diagnostic information
- Store detection method metadata including which strategy successfully retrieved the canister ID, confidence levels, and environment-specific information
- Implement environment-specific detection strategies for both local development and production environments with appropriate fallback logic
- Store manual canister ID overrides with validation and confirmation when automatic detection fails
- Provide comprehensive error logging and diagnostic information storage for canister ID detection failures including attempted methods, environment status, and possible causes
- Store troubleshooting information and step-by-step manual retrieval instructions from dfx.json, deployment logs, and IC dashboard
- Implement real-time canister ID refresh and retry functionality with dynamic detection capabilities
- Store privacy policy content and legal compliance information including updated revenue model, cryptocurrency transaction disclaimers, and user responsibility statements
- Track user consent and privacy preferences
- Implement data encryption for all user data and private assets
- Ensure admin users cannot access private user data or assets
- Store privacy policy acceptance records and timestamps
- Store updated privacy policy content emphasizing no data selling, zero advertisement policy, donation/transaction fee revenue model, cryptocurrency transaction disclaimers, and user fund responsibility
- Provide `.well-known` endpoint or static file serving capability for domain verification that returns `"domain-verification=onlysigned.com"` for both `https://onlysigned.com/.well-known` and `https://onlysigned-3nt.caffeine.xyz/.well-known`
- Generate PDF pitch deck with professional formatting and branding
- Store pitch deck content and images for PDF generation
- Process PDF creation with proper layout, typography, and visual elements
- Include relevant images from asset library in PDF generation
- Provide endpoints for PDF pitch deck generation and download
- Store comprehensive marketplace transaction audit log with chronological tracking of all marketplace transactions including sales, purchases, offers, transfers with transaction type, involved users, asset/copy/collection IDs, price, currency, and timestamp
- Track and store current cycles balance of the backend canister with real-time or refresh-based updates
- Store daily metrics data including number of new users, assets uploaded, signed copies created, sales completed, and total transaction volume for current and previous days
- Implement secure signed copy download system with ownership validation and package generation
- Generate downloadable packages containing both asset files and embedded certificate data with cryptographic proof of authenticity from all signers and ICRC-7 token metadata
- Include manifest or metadata file in download packages with certificate information, asset hash, unique copy ID, ICRC-7 token data, and all signer information for later authenticity verification
- Store download history and tracking for each signed copy with user access logs
- Validate user ownership before allowing signed copy downloads with proper authentication
- Embed certificate data, unique copy identifier, ICRC-7 token metadata, and all co-signer information into downloadable packages with tamper-evident features
- Provide secure download endpoints with comprehensive ownership validation and error handling
- Support downloading of all file types associated with signed copies as unified packages with complete multi-signer information and ICRC-7 compliance data
- Ensure downloaded packages contain verifiable proof of authenticity and ownership with cryptographic signatures from all signers and ICRC-7 token verification
- Process download requests with proper security validation and user feedback
- Track download attempts and successful downloads for audit and security purposes
- Implement admin role reassignment functionality that allows reassigning admin status to the currently connected user's principal
- Update AccessControl state and cached admin references when admin role is reassigned
- Ensure immediate availability of admin privileges after role reassignment including all admin functionality
- Provide secure admin role reassignment endpoint with proper validation and state updates
- Track admin role reassignment history and maintain audit logs for security purposes
- Validate caller identity before allowing admin role reassignment operations
- Update all admin-related caches and state references when admin role is reassigned
- Provide endpoints for all existing functionality plus Certificate Issuer eligibility validation based on follower count, user following system, multi-signer co-signing functionality, ICRC-7 NFT standard compliance, and admin role reassignment

## User Interface
- Clean, modern design suitable for digital collectibles with OnlySigned branding
- Prominent homepage messaging about OnlySigned ushering in a new era of trustless digital authenticity where fakes are impossible
- Main navigation menu with sections: "Marketplace", "Collectibles", "User Explorer", "Contacts", "Support", and "Profile/Wallet"
- Profile type selection interface (Collector/Certificate Issuer) with Certificate Issuer subtype options
- Follower count display and Certificate Issuer eligibility indicators throughout the interface
- Following count display showing how many users the current user is following
- Follow/unfollow buttons on user profile pages with real-time count updates
- Certificate issuance validation with 500 follower requirement enforcement (admin exempt)
- Clear messaging when users don't meet Certificate Issuer requirements
- "Collectibles" section containing Collections and Asset Upload as sub-sections (Certificate Issuers only), plus My Collectibles and Username NFTs pages
- Asset Upload section restricted to Certificate Issuers with follower requirement validation
- Certificate Issuer badges and indicators for different subtypes displayed throughout the platform
- Updated certificate displays showing Certificate Issuer information instead of generic trusted party references
- All existing UI components updated to reflect Certificate Issuer terminology and requirements
- Enhanced pitch deck interface emphasizing trustless authenticity and impossible fakes messaging
- Profile management interface with profile type selection and Certificate Issuer subtype configuration
- Follower count tracking and display in user profiles and search results
- Certificate Issuer eligibility status indicators in user interfaces
- Updated marketplace listings showing Certificate Issuer information and badges
- Certificate validation interface emphasizing on-chain verification and impossibility of fakes with ICRC-7 token data display
- "Invite to Sign" button for asset owners on each signed copy they own
- User invitation interface for selecting and inviting users to co-sign signed copies
- Co-signing invitation management interface for invited users to accept or decline invitations
- Multi-signer display on signed copy detail pages showing all signers clearly
- Updated certificate displays showing all co-signers with their individual information
- Multi-signer certificate validation interface verifying all signatures using ICRC-7 token metadata
- Navigation from co-signer names to their public profiles in certificates and signed copy details
- Fully functional "Invite to Sign" UI that integrates with the new co-signing backend endpoints
- Seamless user experience for sending, receiving, and processing co-signing invitations
- Clear status indicators for co-signing invitation states (pending, accepted, declined)
- Intuitive interface for managing co-signing invitations and tracking invitation history
- "Download" button for each signed copy in user interfaces that calls secure backend endpoint for package download with complete multi-signer information and ICRC-7 compliance data
- Download progress indicators and status messages for signed copy packages with seamless user experience
- Secure download interface with ownership validation and proper error handling for signed copy packages
- Display of download history for signed copies with package information and download status
- User Explorer interface displaying latest active users by default with clickable user cards
- User cards in User Explorer that link directly to public profile pages
- Follow buttons integrated throughout user discovery and profile interfaces
- Real-time follower/following count updates in user interfaces
- Display ICRC-7 NFT information and metadata in signed copy detail pages and certificates
- Show ICRC-7 token ID and metadata in certificate validation results
- Provide ICRC-7 compliance indicators in signed copy listings and marketplace displays
- Enable users to view ICRC-7 token data and metadata for their owned signed copies
- Display interoperability status and external canister compatibility information
- Admin role reassignment interface accessible from the Admin Dashboard for restoring admin access
- Clear admin role reassignment button with confirmation dialog and success feedback
- Immediate update of admin badge and privileges display after role reassignment
- Admin role reassignment status indicators and confirmation messages
- Secure admin role reassignment form with proper validation and error handling
- All existing functionality maintained with updated terminology and Certificate Issuer requirements
- Complete OnlySigned branding throughout all pages, titles, and references
- Updated homepage, navigation, and all relevant pages to reflect OnlySigned brand and ethos
- English language content throughout the application

## Technical Requirements
- Application content language: English
- All existing technical requirements maintained
- Full ICRC-7 NFT standard implementation for signed copies with complete metadata support and interoperability
- Certificate Issuer eligibility validation system based on follower count (minimum 500 followers)
- Admin exemption system for Certificate Issuer requirements
- Profile type management system with Collector and Certificate Issuer options
- Certificate Issuer subtype tracking and validation system
- User following system with follow/unfollow functionality and real-time count tracking
- Follower count tracking and validation system integrated with following relationships
- User activity tracking for latest active users display in User Explorer
- Updated certificate issuance validation to check follower count before allowing operations
- Enhanced user interface validation for Certificate Issuer requirements
- Updated terminology throughout backend and frontend from generic trusted party references to Certificate Issuer
- Multi-signer co-signing system with invitation management and signature tracking in ICRC-7 metadata
- Co-signing invitation system allowing asset owners to invite users to sign copies
- Exemption from eligibility requirements for invited co-signers
- Multi-signer certificate validation and display system using ICRC-7 token data
- Fully functional co-signing invitation system with complete backend and frontend integration
- Seamless user experience for co-signing invitations and multi-signer certificate management
- Secure package download system with certificate embedding and ownership validation for signed copies including all co-signer information and ICRC-7 compliance data
- Cryptographic proof of authenticity in downloaded packages containing both assets and certificates from all signers with ICRC-7 token verification
- Backend endpoint security with proper authentication and authorization for signed copy downloads
- Frontend integration with secure download endpoint providing seamless user experience
- Admin role reassignment system with AccessControl state updates and cached reference management
- Immediate admin privilege restoration after role reassignment with full functionality access
- Secure admin role reassignment with proper validation and audit logging
- Complete OnlySigned branding implementation across all components
- English language enforcement throughout the application
- Modular backend codebase structure using smaller, focused Motoko files for improved build performance and maintainability
- Maintained all existing security, privacy, and technical functionality with new Certificate Issuer requirements, multi-signer co-signing capabilities, ICRC-7 NFT standard compliance, and admin role reassignment functionality
