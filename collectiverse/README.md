# Collectiverse

AI-powered interactive collectible intelligence platform connecting physical trading cards and collectibles to dynamic digital profiles, analytics, QR identity systems, and marketplace infrastructure.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (httpOnly cookies)
- **Image Processing**: Sharp (watermarking, thumbnails)
- **QR System**: Dynamic QR code generation

## Quick Start

```bash
npm install
cp .env.example .env  # Configure DATABASE_URL
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Admin: `admin` / `admin123` at `/admin`

## Features & Routes

### Public Pages
| Feature | Page | API |
|---------|------|-----|
| Homepage | `/` | — |
| Cards (paginated, filterable) | `/cards` | `GET /api/cards/list` |
| Card Detail | `/cards/[id]` | — |
| Players (paginated) | `/players` | `GET /api/players/list` |
| Player Detail | `/players/[id]` | — |
| Sets / Checklists | `/sets` | — |
| Set Detail + Completion | `/sets/[id]` | `GET /api/card-sets/[id]/completion` |
| Marketplace | `/marketplace` | `GET /api/marketplace` |
| Marketplace Listing | `/marketplace/[id]` | `GET /api/marketplace/[id]` |
| Seller Profile | `/marketplace/seller/[userId]` | — |
| Public Profile | `/profile/[userId]` | `GET /api/reputation/[userId]` |
| Digital Passport (Item) | `/passport/item/[publicId]` | `GET /api/passport/item/[publicId]` |
| Digital Passport (Group) | `/passport/group/[publicId]` | `GET /api/passport/group/[publicId]` |
| Global Search | `/search` | `GET /api/search/global` |
| Login | `/login` | `POST /api/auth/login` |
| Register | `/register` | `POST /api/auth/register` |

### Authenticated User Pages
| Feature | Page | API | Nav Location |
|---------|------|-----|--------------|
| Dashboard | `/dashboard` | `GET /api/dashboard/summary` | Navbar: Collection |
| Inventory | `/inventory` | `GET /api/inventory` | Dashboard + Navbar |
| Add to Inventory | `/inventory/add` | `POST /api/inventory` | Dashboard |
| Inventory Detail | `/inventory/[id]` | `GET /api/inventory/[id]` | — |
| Inventory Edit | `/inventory/[id]/edit` | `PATCH /api/inventory/[id]` | — |
| Groups / Lots / Sealed | `/inventory/groups` | `GET /api/inventory-groups` | Dashboard + Navbar |
| Add Group | `/inventory/groups/add` | `POST /api/inventory-groups` | — |
| Group Detail | `/inventory/groups/[id]` | `GET /api/inventory-groups/[id]` | — |
| Wishlist | `/wishlist` | `GET /api/wishlist` | Dashboard + Navbar |
| Add to Wishlist | `/wishlist/add` | `POST /api/wishlist` | — |
| Listings | `/listings` | `GET /api/listings` | Dashboard + Navbar |
| Create Listing | `/listings/add` | `POST /api/listings` | Inventory/Group detail |
| Offers | `/offers` | `GET /api/offers` | Dashboard + Navbar |
| Analytics | `/analytics` | `GET /api/analytics/portfolio` | Dashboard + Navbar |
| Notifications | `/notifications` | `GET /api/notifications` | Navbar 🔔 |
| QR Labels | `/qr-labels` | `GET /api/inventory/[id]/qr` | Dashboard + Navbar |
| Shipments | `/shipments` | `GET /api/shipments` | Dashboard + Navbar |
| Payments | `/payments` | `GET /api/payments` | Dashboard + Navbar |
| Disputes | `/disputes` | `GET /api/disputes` | Dashboard + Navbar |
| Dispute Detail | `/disputes/[id]` | `GET /api/disputes/[id]` | — |
| Account | `/account` | `PATCH /api/account` | Navbar |

### Admin Pages
| Feature | Page | API |
|---------|------|-----|
| Admin Dashboard | `/admin` | `GET /api/admin/analytics` |
| Cards CRUD | `/admin` (tab) | `GET/POST /api/admin/cards` |
| Players CRUD | `/admin` (tab) | `GET/POST /api/admin/players` |
| Sets CRUD | `/admin` (tab) | `GET/POST /api/admin/sets` |
| Sports CRUD | `/admin` (tab) | `GET/POST /api/admin/sports` |
| Teams CRUD | `/admin` (tab) | `GET/POST /api/admin/teams` |
| Users CRUD | `/admin` (tab) | `GET/POST /api/admin/users` |
| Image Review | `/admin` (tab) | `GET /api/admin/images` |
| Duplicate Detection | `/admin` (tab) | `GET /api/admin/duplicates` |
| Reports | `/admin` (tab) | `GET /api/admin/reports` |
| Audit Log | — | `GET /api/admin/audit` |

## Prisma Models (34)

Person, Sport, Team, PersonTeam, PersonSport, CardSet, Card, Grade, Collection, CollectionCard, Transaction, QrScan, CardMedia, CardImage, Admin, User, InventoryItem, InventoryTransaction, Report, AuditLog, InventoryGroup, InventoryGroupItem, Listing, OwnershipTransfer, MarketValueSnapshot, WishlistItem, Notification, Offer, UserReputation, Feedback, Dispute, DisputeMessage, Shipment, PaymentIntent, PaymentEvent

## Architecture

- **Public Card Database**: One record per known card type (shared)
- **Private User Inventory**: One record per physical copy owned (isolated per user)
- **Private Storage**: `storage/private/users/{userId}/` (never served publicly)
- **Public Images**: `public/uploads/cards/` (watermarked)
- **Authenticated Media**: Served via `/api/inventory/[id]/media/[type]`

## Security

- JWT httpOnly cookies for auth
- Ownership verified server-side on every private route
- Private media served only through authenticated API (never direct file access)
- Watermarked display images (originals never served)
- Path traversal prevention on all file operations
- Admin routes require ADMIN role
- User data isolated — no cross-user access
