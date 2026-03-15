# Boges2Birds

**Your personal golf training system.**

A structured golf practice app for players working to Break 100, 90, or 80. Users enroll in a program, complete 4-week training blocks built around their weakest skills, log round stats, and get AI-formatted weekly practice plans.

---

## Features

- **Break 100 / 90 / 80 programs** — structured 4-week training blocks tailored to your target score
- **Skill priority engine** — analyzes round stats (fairways, GIR, putts, penalties) to rank what to work on most
- **AI-formatted practice plans** — OpenAI generates friendly weekly summaries from the structured block data
- **Round logging** — track scores, fairways hit, GIR, putts, and penalties over time
- **Drill library** — curated practice drills mapped to skill areas and session types
- **Offline-first** — everything works without a connection; syncs to the cloud in the background
- **Freemium with paywall** — Week 1 preview for free; premium unlocks full training blocks, round logging, and drill library

---

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 54 (managed workflow) |
| Router | Expo Router v6 |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| Local DB | expo-sqlite + Drizzle ORM |
| Cloud | Supabase (Postgres + Auth + RLS) |
| Subscriptions | RevenueCat |
| LLM | OpenAI gpt-4o-mini |
| Language | TypeScript |

---

## Getting Started

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) on your iOS or Android device (for development)

### Install

```bash
git clone https://github.com/RemleyNick/boges2birds.git
cd boges2birds
npm install
```

### Run

```bash
npx expo start
```

Scan the QR code with your camera (iOS) or the Expo Go app (Android).

### Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_RC_APPLE_API_KEY=
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
```

> **Note:** RevenueCat requires native modules. Use `npx expo run:ios` or an EAS dev build — paywall features won't work in Expo Go.

---

## Project Structure

```
app/                  Expo Router screens
  (onboarding)/       Program select, assessment, generating
  (tabs)/             Home, Practice, Log Round, Library, Profile
src/
  engine/             Pure TypeScript business logic (no React)
  db/                 Drizzle schema + SQLite client + migrations
  repositories/       CRUD layer per table
  services/           LLM, sync, auth, subscriptions
  hooks/              Data fetching + subscription gate
  components/         UI primitives and screen components
  constants/          Colors, program config
```

---

## Roadmap

- [x] Project setup (Expo Router, NativeWind, TypeScript)
- [x] Welcome screen
- [x] Skill priority engine + drill selector + block generator
- [x] Drizzle schema + SQLite migrations + seed data
- [x] Onboarding flow (program select → assessment → block generation)
- [x] Home screen (training block overview, session cards)
- [x] Practice session flow (drill checklist, session completion)
- [x] Round logging (form with input validation)
- [x] Drill library (skill-area filters, expandable cards)
- [x] Profile (identity, program, skill ratings, weekly time, round stats)
- [x] Auth (sign-up/sign-in, guest migration)
- [x] RevenueCat subscription + paywall
- [x] Offline sync (SQLite → Supabase push pipeline)
- [x] UI/styling polish
- [x] EAS build config + app identifiers
- [x] Error boundary + crash reporting (Sentry)
- [x] LLM integration (OpenAI gpt-4o-mini)
- [x] Mutation error handling across screens
- [x] Apple privacy manifest
- [x] RevenueCat dashboard setup (create project, configure products in App Store Connect, add real API key to `.env`)
- [x] Sentry project setup (create project at sentry.io, add DSN to `.env`)
- [x] EAS credentials (`appleTeamId` + `ascAppId` in `eas.json` submit config)
- [x] Set price for Premium membership in App Store Connect
- [ ] Add Paywall UI to RevenueCat offering (required for `presentPaywallIfNeeded` to work)
- [ ] First EAS preview build + device testing (`eas build --profile preview`)
- [ ] Configure Sentry source map upload for production builds (org/project/auth token in EAS env)
- [ ] Production build + TestFlight (`eas build --profile production` → `eas submit`)
- [ ] Update App Store link in landing page (`docs/index.html` — replace `href="#"` on the App Store badge once the app is live)
- [ ] App Store submission
- [ ] OpenAI API key (add key to `.env` for AI-generated practice plan summaries)
