# Collectiverse Feature Matrix

## Core Features

| Feature | Prisma Model | API | UI Page | Nav Link | Status |
|---------|-------------|-----|---------|----------|--------|
| Cards | Card ✓ | /api/cards ✓ | /cards ✓ | Browse > Cards ✓ | Complete |
| Comics | ComicIssue ✓ | /api/comics ✓ | /comics ✓ | Browse > Comics ✓ | Complete |
| Sealed Products | SealedProduct ✓ | /api/sealed-products ✓ | /sealed-products ✓ | Browse > Sealed ✓ | Complete |
| Memorabilia | MemorabiliaItem ✓ | /api/memorabilia ✓ | /memorabilia ✓ | Browse > Memorabilia ✓ | Complete |
| Tickets | TicketCollectible ✓ | /api/tickets ✓ | /tickets ✓ | Browse > Tickets ✓ | Complete |
| Coins | CoinCollectible ✓ | /api/coins ✓ | /coins ✓ | Browse > Coins ✓ | Complete |
| Video Games | VideoGameCollectible ✓ | /api/video-games ✓ | /video-games ✓ | Browse > Video Games ✓ | Complete |
| Toys & Figures | ToyCollectible ✓ | /api/toys ✓ | /toys ✓ | Browse > Toys ✓ | Complete |
| Music / Vinyl | MusicCollectible ✓ | /api/music ✓ | /music ✓ | Browse > Music ✓ | Complete |
| Collectibles | Collectible ✓ | /api/collectibles ✓ | /collectibles ✓ | Browse > All ✓ | Complete |
| Catalog | Collectible ✓ | /api/catalog/[id] ✓ | /catalog/[id] ✓ | — | Complete |

## Inventory & Collection

| Feature | Prisma Model | API | UI Page | Nav Link | Status |
|---------|-------------|-----|---------|----------|--------|
| Inventory | InventoryItem ✓ | /api/inventory ✓ | /inventory ✓ | Collection > Inventory ✓ | Complete |
| Inventory Groups | InventoryGroup ✓ | /api/inventory-groups ✓ | /inventory/groups ✓ | Collection > Groups ✓ | Complete |
| Add Collectible | — | — | /inventory/add/select-type ✓ | Collection > Add ✓ | Complete |
| Import Inventory | InventoryImportBatch ✓ | /api/inventory/import ✓ | /inventory/import ✓ | Collection > Import ✓ | Complete |
| Wishlist | WishlistItem ✓ | /api/wishlist ✓ | /wishlist ✓ | Collection > Wishlist ✓ | Complete |
| Analytics | — | /api/analytics ✓ | /analytics ✓ | Collection > Analytics ✓ | Complete |
| QR Labels | — | /api/qr ✓ | /qr-labels ✓ | Collection > QR Labels ✓ | Complete |
| Checklists | Checklist ✓ | /api/checklists ✓ | /checklists ✓ | Browse > Checklists ✓ | Complete |

## Marketplace & Sales

| Feature | Prisma Model | API | UI Page | Nav Link | Status |
|---------|-------------|-----|---------|----------|--------|
| Marketplace | Listing ✓ | /api/marketplace ✓ | /marketplace ✓ | Marketplace > Home ✓ | Complete |
| Listings | Listing ✓ | /api/listings ✓ | /listings ✓ | Marketplace > Listings ✓ | Complete |
| Offers | Offer ✓ | /api/offers ✓ | /offers ✓ | Marketplace > Offers ✓ | Complete |
| Sales | Sale ✓ | /api/sales ✓ | /sales ✓ | Marketplace > Sales ✓ | Complete |
| Sale Detail | Sale ✓ | /api/sales/[id] ✓ | /sales/[id] ✓ | — | Complete |
| External Sales | Sale ✓ | /api/sales/manual ✓ | /sales/manual ✓ | Marketplace > External ✓ | Complete |
| Buy Now | Sale ✓ | /api/marketplace/[id]/buy-now ✓ | /marketplace/[id] ✓ | — | Complete |
| Shipments | Shipment ✓ | /api/shipments ✓ | /shipments ✓ | Marketplace > Shipments ✓ | Complete |
| Payments | PaymentIntent ✓ | /api/payments ✓ | /payments ✓ | Marketplace > Payments ✓ | Complete |
| Disputes | Dispute ✓ | /api/disputes ✓ | /disputes ✓ | Marketplace > Disputes ✓ | Complete |
| Feedback | Feedback ✓ | /api/feedback ✓ | /feedback ✓ | Marketplace > Feedback ✓ | Complete |
| Sale Financials | SaleExpense ✓ | /api/sales/[id]/financials ✓ | /sales/[id] ✓ | — | Complete |

## Live Events

| Feature | Prisma Model | API | UI Page | Nav Link | Status |
|---------|-------------|-----|---------|----------|--------|
| Live Events | LiveEvent ✓ | /api/live-events ✓ | /live ✓ | Live > Live Now ✓ | Complete |
| Live Studio | — | /api/live/studio ✓ | /live/studio ✓ | Live > Studio ✓ | Complete |
| My Live Activity | — | /api/live/my-activity ✓ | /live/my-activity ✓ | Live > Activity ✓ | Complete |
| Create Event | LiveEvent ✓ | /api/live-events ✓ | /live/create ✓ | Live > Create ✓ | Complete |
| Live Claims | LiveClaim ✓ | /api/live-claims ✓ | /live/[id] ✓ | — | Complete |
| Live Auctions | LiveBid ✓ | /api/live-events/[id]/items/[id]/bid ✓ | /live/[id] ✓ | — | Complete |
| Live Breaks | LiveBreak ✓ | /api/live-breaks ✓ | /live/[id] ✓ | — | Complete |
| Live Chat | LiveEventMessage ✓ | /api/live-events/[id]/messages ✓ | /live/[id] ✓ | — | Complete |
| Moderation | LiveEventModerationAction ✓ | /api/live-events/[id]/moderation ✓ | /live/[id]/manage ✓ | — | Complete |
| Event Recap | LiveEventRecap ✓ | /api/live-events/[id]/recap ✓ | /live/[id]/recap ✓ | — | Complete |
| Reminders | LiveEventReminder ✓ | /api/live-events/[id]/reminders ✓ | /live/[id] ✓ | — | Complete |

## Admin

| Feature | Prisma Model | API | UI Page | Nav Link | Status |
|---------|-------------|-----|---------|----------|--------|
| Card Import | ImportBatch ✓ | /api/admin/import ✓ | /admin/import ✓ | Admin > Imports ✓ | Complete |
| Comic Import | — | /api/admin/import/comics ✓ | /admin/import/comics ✓ | Admin > Comic Imports ✓ | Complete |
| Import Connectors | ImportConnector ✓ | /api/admin/import-connectors ✓ | /admin/import-connectors ✓ | Admin > Connectors ✓ | Complete |
| Import Jobs | ImportJob ✓ | /api/admin/import-jobs ✓ | /admin/import-jobs ✓ | Admin > Jobs ✓ | Complete |
| Card Reviews | PublicCardReview ✓ | /api/admin/card-reviews ✓ | /admin/card-reviews ✓ | Admin > Reviews ✓ | Complete |
| Duplicates | — | /api/admin/duplicates ✓ | /admin/duplicates ✓ | Admin > Duplicates ✓ | Complete |
| Verification | CardFact ✓ | /api/admin/verification ✓ | /admin/verification ✓ | Admin > Verification ✓ | Complete |
| Card Identities | CardIdentity ✓ | /api/admin/card-identities ✓ | /admin/card-identities ✓ | Admin > Identities ✓ | Complete |
| Manufacturers | Manufacturer ✓ | /api/admin/manufacturers ✓ | /admin/manufacturers ✓ | Admin > Manufacturers ✓ | Complete |
| Brands | Brand ✓ | /api/admin/brands ✓ | /admin/brands ✓ | Admin > Brands ✓ | Complete |
| Blog | BlogPost ✓ | /api/admin/blog ✓ | /blog ✓ | — | Complete |

## Account & Billing

| Feature | Prisma Model | API | UI Page | Nav Link | Status |
|---------|-------------|-----|---------|----------|--------|
| Account | User ✓ | /api/account ✓ | /account ✓ | Account > Profile ✓ | Complete |
| Shipping Addresses | ShippingAddress ✓ | /api/shipping-addresses ✓ | /account/shipping-addresses ✓ | Account > Addresses ✓ | Complete |
| Notifications | Notification ✓ | /api/notifications ✓ | /notifications ✓ | Account > Notifications ✓ | Complete |
| Activity | — | /api/activity ✓ | /activity ✓ | Account > Activity ✓ | Complete |
| Pricing | MembershipPlan ✓ | /api/membership/plans ✓ | /pricing ✓ | — | Complete |
| Billing | UserSubscription ✓ | /api/account/subscription ✓ | /account/billing ✓ | Account > Billing | Complete |
| Usage | UsageSnapshot ✓ | /api/account/usage ✓ | — | — | API Only |
| Organizations | Organization ✓ | /api/organizations ✓ | — | — | API Only |
| Storefronts | Storefront ✓ | /api/storefronts ✓ | /storefronts ✓ | Marketplace > Storefronts | Complete |

## Data Infrastructure

| Feature | Prisma Model | Status |
|---------|-------------|--------|
| Card Fingerprinting | CardIdentity ✓ | Complete |
| Fact Verification | CardFact, DataSource ✓ | Complete |
| Product Hierarchy | Manufacturer, Brand, ProductRelease, ChecklistSection ✓ | Complete |
| Import Matching | — (library) | Complete |
| Import Profiles | InventoryImportProfile ✓ | Complete |
| Inventory Reservation | InventoryReservation ✓ | Complete |
| Audit Logging | AuditLog ✓ | Complete |
| Collectible Types | CollectibleType ✓ | Complete |
