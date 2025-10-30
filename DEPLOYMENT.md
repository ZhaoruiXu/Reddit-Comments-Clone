# Reddit Comments Clone - Deployment Guide

## Current Setup

- **Client**: React app (can deploy to Cloudflare Pages)
- **Server**: Node.js + Fastify + Prisma
- **Database**: Currently SQLite (local dev only)

## Local Development

### Option 1: SQLite (Current - Quick & Easy)
```bash
# Already configured!
DATABASE_URL="file:./dev.db"
```

### Option 2: PostgreSQL (Recommended for production-like dev)
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Or use Docker
docker run --name reddit-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Update server/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reddit_comments"

# Update server/prisma/schema.prisma
# Change provider from "sqlite" to "postgresql"

# Reset and migrate
cd server
rm -rf prisma/migrations
rm dev.db
npx prisma migrate dev --name init
```

## Production Deployment

**⚠️ IMPORTANT**: Use PostgreSQL in production, NOT SQLite!

### Recommended Architecture

```
┌─────────────────────┐
│  Cloudflare Pages   │  ← Client (React)
│  (Static Hosting)   │
└──────────┬──────────┘
           │ API calls
           ↓
┌─────────────────────┐     ┌──────────────────┐
│   Railway/Render    │────→│   PostgreSQL     │
│   (Node.js Server)  │     │   (Database)     │
└─────────────────────┘     └──────────────────┘
```

### Deployment Options

#### Option 1: Railway (Easiest)
1. **Server + Database in one place**
   ```bash
   cd server
   railway init
   railway add postgresql
   railway up
   ```
2. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (auto-provided by Railway PostgreSQL)
   - `COOKIE_SECRET=your-random-secret`
   - `NODE_ENV=production`
   - `LIVE_CLIENT_URL=https://your-app.pages.dev`
   - `PORT=3001`

3. **Client to Cloudflare Pages**
   ```bash
   cd client
   # Update src/services/makeRequest.js with production server URL
   npm run build
   # Deploy build/ folder to Cloudflare Pages
   ```

#### Option 2: Render.com (Free Tier Available)
1. **Create PostgreSQL database** on Render
2. **Create Web Service** for server
   - Build Command: `cd server && npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `cd server && node server.js`
3. **Client to Cloudflare Pages**

#### Option 3: Vercel (Server) + Neon (Database)
1. **Create PostgreSQL on Neon** (free tier)
2. **Deploy server to Vercel**
   - Add `vercel.json` configuration
3. **Client to Cloudflare Pages**

### Environment Variables for Production

**Server (.env in production hosting):**
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
PORT=3001
NODE_ENV=production
LIVE_CLIENT_URL=https://your-cloudflare-pages.pages.dev
COOKIE_SECRET=generate-a-secure-random-string
```

**Client (update in code before build):**
Update `client/src/services/makeRequest.js` to point to your production server URL.

### Database Migration in Production

When deploying, use `prisma migrate deploy` (not `dev`):
```bash
npx prisma migrate deploy
```

This applies migrations without prompts - safe for production.

### Schema Differences: SQLite vs PostgreSQL

**Prisma handles most differences automatically**, but switch to PostgreSQL before deploying:

**server/prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then regenerate migrations:
```bash
cd server
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

## Monorepo Deployment (Both in One Repo)

Since your client and server are in the same repo, you have options:

### Separate Deployments (Recommended)
- **Client**: Deploy `client` folder to Cloudflare Pages
- **Server**: Deploy `server` folder to Railway/Render

Both platforms can deploy from subdirectories:
- Railway: Set root directory to `server`
- CF Pages: Set build output to `client/build`

### Alternative: Deploy Both to One Platform
Some platforms (Railway, Render) support monorepos, but this is less common for static + API apps.

## Summary

**For Production:**
1. ✅ Switch to PostgreSQL (in schema.prisma)
2. ✅ Deploy server to Railway/Render with PostgreSQL
3. ✅ Deploy client to Cloudflare Pages
4. ✅ Update CORS settings with production URLs
5. ✅ Use secure COOKIE_SECRET

**Currently (Development):**
- SQLite is fine for local dev
- But consider using local PostgreSQL to match production environment

