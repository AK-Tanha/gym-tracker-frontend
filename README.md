# Stat·Fit — Gym Workout Tracker

A full-stack, mobile-first **Progressive Web App** for tracking gym workouts, built with **Next.js 16**, **React 19**, **TypeScript**, and **MongoDB**. Installable on any device with offline support — no app store required.

---

## What It Does

Stat·Fit helps athletes plan, execute, and analyze their workouts:

- **Program Builder** — Create multi-day workout programs with exercises organized by muscle group, including superset and giant-set grouping.
- **Guided Workout Runner** — Step-by-step workout execution with a rest timer, audio/vibration cues, and auto-logged results.
- **Progress Dashboard** — Workout streaks, weekly activity charts, personal record tracking, and tonnage history.
- **Exercise Library** — ~85 curated exercises across 10 muscle-group categories with search and filter.
- **Profile & Preferences** — Unit switching (kg/lbs), workout reminders, body weight logging.
- **Admin Panel** — Guardian (superadmin) role with user management, platform stats, and per-user data oversight.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Tabler Icons |
| Language | TypeScript 5 |
| State | TanStack React Query 5 |
| Auth | NextAuth 5 (JWT, Credentials provider, bcrypt) |
| Validation | Zod 4 |
| Database | MongoDB 7 |
| PWA | Service Worker, Web App Manifest |

---

## Key Technical Decisions

- **Monorepo-free architecture** — API routes, UI, and server actions coexist in the Next.js App Router for simplified deployment and zero cold-start overhead.
- **JWT-based auth** with role-based access control (`user` / `superadmin`) enforced both client-side (conditional UI) and server-side (API route guards, middleware).
- **Single-document-per-user pattern** in MongoDB — each user's data lives in one document per collection, scoped by a prefixed ID, optimizing for read-heavy access patterns.
- **Progressive Web App (PWA)** — fully installable on iOS and Android with a custom service worker, offline fallback page, and "Add to Home Screen" flow with platform-specific instructions.
- **Input validation on both ends** — Zod schemas validate at the API boundary; React Query manages cache invalidation and optimistic updates.

---

## Progressive Web App

Stat·Fit is a **full PWA** — not just a website with a manifest bolted on:

- **Installable** — one-tap "Add to Home Screen" on iOS and Android, with a custom install button and iOS-specific instructions.
- **Offline-ready** — service worker caches all static assets; a dedicated offline page keeps the app usable without a connection.
- **Native feel** — standalone display mode, custom splash screen, and app icons for every platform.
- **Next.js 16 `useOffline`** — leverages the experimental offline API for seamless network state detection.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)

### Setup

```bash
git clone <repo-url>
cd gym-tracker-frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```
MONGODB_URI=mongodb://localhost:27017
AUTH_SECRET=<generate with: openssl rand -base64 32>
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run superadmin` | Create/promote a superadmin user |

---

## Project Structure

```
app/
  api/          # RESTful API routes (auth, programs, progress, admin)
  dashboard/    # Home dashboard with streaks & activity
  programs/     # Program CRUD and workout day editor
  workout/      # Guided workout runner
  progress/     # Analytics, PRs, history
  profile/      # User preferences
  admin/        # Guardian panel
components/     # Reusable UI (forms, modals, nav, PWA helpers)
lib/            # Auth config, DB client, types, query hooks, helpers
```
