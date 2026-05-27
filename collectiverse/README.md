# Collectiverse

AI-powered interactive collectible intelligence platform connecting physical trading cards to dynamic digital profiles, analytics, QR identity systems, and future AI grading infrastructure.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (httpOnly cookies)
- **QR System**: Dynamic QR code generation per card
- **Storage**: Local/S3 (configurable)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data (5 players, 25 cards, admin account)
npm run db:seed

# Start development server
npm run dev
```

## Admin Access

After seeding: `admin` / `admin123` at `/admin`

## URL Structure

| Page | URL |
|------|-----|
| Home | `/` |
| Cards | `/cards` |
| Card Profile | `/cards/{id}` |
| Players | `/players` |
| Player Profile | `/players/{id}` |
| Sets | `/sets` |
| Set Detail | `/sets/{id}` |
| Team | `/teams/{id}` |
| Admin | `/admin` |

## Architecture

- PostgreSQL as system-of-record (relational integrity, complex queries, AI-ready)
- Prisma ORM with full relational schema
- Server-side rendering for SEO
- Client components for interactive features (search, admin)
- AI placeholder stubs in `src/lib/ai-placeholders.ts`
- QR code generation linking physical cards to digital profiles

## Future-Ready

Architecture supports future addition of:
- AI grading (computer vision)
- pgvector embeddings for similarity search
- Marketplace/auction system
- Blockchain provenance
- Mobile app (API-first design)
- Redis caching layer
- S3 asset storage with CloudFront CDN

## Deployment

Designed for AWS Amplify with:
- PostgreSQL (RDS or Neon/Supabase)
- S3 for card images
- CloudFront CDN
- Environment variables for all secrets
