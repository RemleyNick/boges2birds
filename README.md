# Boges2Birds

**Your personal golf training system.**

A structured golf practice app for players working to Break 100, 90, or 80. Users enroll in a program, configure their practice schedule, complete structured 4-week training blocks built around their weakest skills, and log round stats to track their progress.

---

## Features

- **Break 100 / 90 / 80 programs** -- structured 4-week training blocks tailored to your target score
- **Per-session scheduling** -- choose 1-4 sessions per week, session duration (30/45/60/90 min), and how skills are grouped
- **Session structure modes** -- Focused (venue-based grouping), Mixed (all skills every session), or Auto (venue-based with priority ordering)
- **Skill priority engine** -- analyzes round stats (fairways, GIR, putts, penalties) to rank what to work on most
- **Day-by-day practice plans** -- sessions labeled by activity ("Day 1 -- Driving Range", "Day 2 -- Short Game + Putting")
- **Round logging** -- track scores, fairways hit, GIR, putts, and penalties over time
- **Library** -- segmented browser for curated practice drills and golf articles, each filterable by category
- **Offline-first** -- everything works without a connection; syncs to the cloud in the background
- **Freemium with paywall** -- Week 1 preview for free; premium unlocks full training blocks
- **In-app feedback** -- users report bugs or suggest improvements from Profile; submissions email the developer via Resend

---

## How It Works

1. **Choose a program** -- Break 100, Break 90, or Break 80 based on your scoring goals
2. **Rate your skills** -- Self-assess across 5 areas: tee shots, iron play, short game, putting, and course management
3. **Configure your schedule** -- Pick sessions per week, duration per session, and a structure preference
4. **Get a plan** -- The engine generates a 4-week training block with day-by-day drill assignments
5. **Practice and log** -- Complete sessions, log rounds, and the engine adapts your next block

### Session Structure Modes

Users choose how skills are grouped across their weekly sessions:

| Structure | Description |
|-----------|-------------|
| **Focused** | Skills grouped by venue -- range skills together (tee shots, irons), short game + putting together |
| **Mixed** | All 5 skills in every session, time split by priority |
| **Auto** | Venue-based groupings (like focused) with skills reordered by priority within each group |

Example for 2 sessions/week (Focused or Auto):
- **Day 1 -- Driving Range**: Tee shots, irons, course management
- **Day 2 -- Short Game + Putting**: Short game, putting

Time within each session is distributed proportionally by priority score -- weaker skills get more practice time.

---

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 54 (managed workflow) |
| Router | Expo Router v6 |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| UI State | Zustand v5 |
| Server State | TanStack Query v5 |
| Local DB | expo-sqlite + Drizzle ORM |
| Cloud | Supabase (Postgres + Auth + RLS) |
| Subscriptions | RevenueCat SDK v8 |
| Crash Reporting | Sentry |
| Transactional Email | Resend (feedback notifications) |
| Language | TypeScript v5 |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Xcode (for iOS simulator builds)

### Install

```bash
git clone https://github.com/RemleyNick/boges2birds.git
cd boges2birds
npm install
```

### Run on Simulator

```bash
# Generate native project
npx expo prebuild --clean

# Build for simulator
SENTRY_DISABLE_AUTO_UPLOAD=true xcodebuild \
  -workspace ios/boges2birds.xcworkspace \
  -scheme Boges2Birds \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath ios/build

# Install and launch
xcrun simctl install "iPhone 17 Pro" ios/build/Build/Products/Debug-iphonesimulator/Boges2Birds.app
xcrun simctl launch "iPhone 17 Pro" com.boges2birds.app

# Start Metro bundler
npx expo start --clear
```

> **Note:** RevenueCat requires native modules. Paywall features won't work in Expo Go -- use a dev build or simulator build.

### Tests

```bash
npx jest
```

Engine unit tests cover thresholds, skill priority scoring, block generation, skill grouping, drill selection, and session labeling (132 tests).

### Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_RC_APPLE_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
```

### Feedback Email (Resend)

The Profile → Send feedback form writes to a Supabase `feedback` table. A Postgres trigger calls the `notify-feedback` Edge Function, which forwards the submission to the developer via [Resend](https://resend.com).

The Edge Function reads three secrets, set in Supabase (not in `.env` -- they live server-side):

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  FEEDBACK_RECIPIENT_EMAIL=you@example.com \
  FEEDBACK_FROM_EMAIL=onboarding@resend.dev
```

#### Verify a custom Resend sender domain (recommended for production)

`onboarding@resend.dev` works out of the box but only delivers to the email address tied to your Resend account. To send from a real address like `feedback@boges2birds.com` and reach any inbox, verify a domain you own:

1. **Add the domain in Resend**: https://resend.com/domains → **Add Domain** → enter your domain (e.g., `boges2birds.com`). Pick a region close to your Supabase project.
2. **Copy the DNS records Resend generates** (3-5 records: SPF/TXT, DKIM CNAMEs, optionally DMARC).
3. **Add them at your DNS provider** (Cloudflare, Namecheap, GoDaddy, Route 53, etc.). Use the exact host/value Resend provides; do not append the apex domain if your provider does that automatically.
4. **Wait for verification** -- usually a few minutes, sometimes hours depending on propagation. Resend's domains page polls automatically and turns green when ready.
5. **Update the Supabase secret to point at the verified address** (no function redeploy needed -- secrets are read at request time):
   ```bash
   supabase secrets set FEEDBACK_FROM_EMAIL=feedback@boges2birds.com
   ```

Production currently uses `feedback@boges2birds.com`. New environments can stay on `onboarding@resend.dev` until they verify a custom domain.

---

## Project Structure

```
app/
  _layout.tsx                        -- Root Stack + QueryClientProvider + guest user init
  index.tsx                          -- Welcome screen
  (auth)/
    sign-in.tsx                      -- Email + password login
    sign-up.tsx                      -- Registration + guest migration
  (onboarding)/
    program-select.tsx               -- Choose Break 100/90/80
    baseline-assessment.tsx          -- Skill ratings + session config (sessions/week, duration, structure)
    create-account.tsx               -- Post-onboarding account creation prompt
    generating.tsx                   -- Engine runs, saves block to DB
  practice/
    [sessionId].tsx                  -- Drill list with checkboxes, session completion
  feedback.tsx                       -- Bug report / improvement request form (calls submit_feedback RPC)
  (tabs)/
    index.tsx                        -- Home (weekly session cards: "Day 1 -- Driving Range")
    log-round.tsx                    -- Round logging form (9/18 holes, stats)
    library.tsx                      -- Drills + articles browser (segmented control, category filters)
    profile.tsx                      -- Identity, program, skill ratings, session config, round stats

src/
  engine/                            -- Pure TypeScript business logic (no React)
    thresholds.ts                    -- Threshold constants, program multipliers
    skillPriorityEngine.ts           -- Stat scoring, blending, priority ranking
    skillGrouping.ts                 -- Session skill groupings (focused/auto/mixed) + labels
    blockGenerator.ts                -- 4-week block generation, time distribution
    drillSelector.ts                 -- Maps skill + duration to drill assignments
    drillSeeds.ts                    -- 25 built-in drills across all skill areas and programs
  db/
    schema.ts                        -- Drizzle schema (single source of truth)
    client.ts                        -- expo-sqlite connection
    migrations/                      -- SQL migrations
  repositories/                      -- CRUD layer per table
  services/
    auth.ts                          -- Supabase Auth wrapper
    sync.ts                          -- SQLite -> Supabase background sync
    subscriptions.ts                 -- RevenueCat wrapper
    feedback.ts                      -- submit_feedback RPC client + diagnostics gathering

supabase/
  migrations/                        -- Supabase Postgres schema (SQL)
  functions/
    notify-feedback/                 -- Edge Function: webhook -> Resend on new feedback row
  hooks/                             -- TanStack Query hooks + mutations
  store/                             -- Zustand stores (onboarding, user)
  components/
    ui/                              -- Reusable primitives (Button, Card, etc.)
    ErrorBoundary.tsx                -- Sentry-reporting error boundary
    PaywallModal.tsx                 -- RevenueCat paywall
  constants/
    colors.ts                        -- Design tokens
    programs.ts                      -- Program slugs and config
  types/
    index.ts                         -- Shared TypeScript types
```

---

## Roadmap

### Completed

- [x] Project setup (Expo Router, NativeWind, TypeScript)
- [x] Welcome screen
- [x] Skill priority engine + drill selector + block generator
- [x] Drizzle schema + SQLite migrations + seed data
- [x] Onboarding flow (program select -> assessment -> block generation)
- [x] Per-session scheduling (1-4 sessions/week, configurable duration, focused/mixed/auto structure)
- [x] Home screen (day-by-day session cards with venue labels)
- [x] Practice session flow (drill checklist, session completion)
- [x] Round logging (form with input validation)
- [x] Library (segmented drills + articles browser with category filters, expandable cards)
- [x] Profile (identity, program, skill ratings, session config, round stats)
- [x] Auth (sign-up/sign-in, guest migration)
- [x] RevenueCat subscription + paywall
- [x] Offline sync (SQLite -> Supabase push pipeline)
- [x] UI/styling polish
- [x] EAS build config + app identifiers
- [x] Error boundary + crash reporting (Sentry)
- [x] Apple privacy manifest
- [x] In-app feedback form (Supabase RPC + Resend email pipeline)
- [x] Custom Resend sender domain verified (feedback emails come from `feedback@boges2birds.com`)
- [x] Sentry source map upload configured (`organization` + `project` passed to the `@sentry/react-native` Expo plugin in `app.json` so prebuild generates `sentry.properties` correctly on EAS; `SENTRY_AUTH_TOKEN` stored as a sensitive EAS env var on the production environment)
- [x] EAS production env cleaned up (removed duplicate plaintext `EXPO_PUBLIC_RC_APPLE_API_KEY`; only the secret copy remains)
- [x] RevenueCat / App Store Connect dashboard setup (subscription products created in App Store Connect, attached to the `premium` entitlement in RevenueCat, current offering published with paywall verified working in-app)
- [x] First production EAS build -- build 5 (commit `0d90de6`, IPA `kmNBok4RkZEfrcdEuHRGWp.ipa`) finished cleanly on the `production` profile. Native crash reporting (Sentry SDK) compiled into the binary. JS source map upload took builds 6-11 to fully wire (see items below).
- [x] **TestFlight + sandbox subscription test** -- build 5 installed on a physical device via TestFlight, onboarding ran cleanly, login + premium flows verified, sandbox purchase confirmed in the RevenueCat dashboard.
- [x] **Sentry JS source-map upload wired for EAGER_BUNDLE builds** -- `eas-hooks/eas-build-on-success.sh` registered as an `eas-build-on-success` npm script. The hook locates the non-empty `main.jsbundle` produced by EAS's eager bundle (the file next to the `.map` in `DerivedSources/` is a 0-byte Xcode dependency-tracking stub, not the real bundle), pairs it with the source map in a temp dir, and uploads via `sentry-expo-upload-sourcemaps`. Two non-obvious workarounds were needed: (a) the helper's expo-config lookup only matches the `@sentry/react-native/expo` plugin name and our `app.json` uses the bare `@sentry/react-native`, so `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_URL` are exported in the hook to skip the lookup; (b) the helper's `isAsset` filter (`node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps.js`) accepts `.map` / `.js` / `.hbc` but not `.jsbundle`, so the bundle is renamed to `main.hbc` (semantically correct since the .ipa ships Hermes bytecode anyway) before the helper scan.
- [x] **TestFlight smoke-check** -- hidden 7-tap-on-version-label trigger in Profile (`app/(tabs)/profile.tsx`) fires `Sentry.captureException`. On build 11 the Sentry event symbolicates to `app/(tabs)/profile.tsx:94:40 in onVersionTap` with full TypeScript source preview (debug ID `c948a664-efd6-4446-9702-2b03df918fe2`). The trigger stays in the binary as a permanent diagnostic — invisible to users, just shows an alert if discovered.

### Next Steps (in order)

1. [ ] **App Store release of build 11** -- `eas submit` has already uploaded build 11 (`ec55f39c-1202-494a-9be7-356b11cd0865`) to App Store Connect, so the binary is available in TestFlight. To release to the App Store: in https://appstoreconnect.apple.com → boges2birds → "App Store" tab → create iOS app version `1.0.0` → attach build 11 → fill in store metadata (description, screenshots for required device sizes, keywords, support URL, marketing URL, privacy policy URL, app privacy details, age rating, pricing) → submit for review. Apple review typically takes 24-48 hours.
2. [ ] **Apple review + initial rollout** -- watch App Store Connect for review status, release on approval (manual or phased), monitor Sentry / RevenueCat / Supabase for the first day's crashes, subscription events, and sync errors.

### Post-launch backlog

- [ ] Round-over-round progress tracking and visualizations
- [ ] Block-to-block skill trend analysis
- [ ] Push notifications for practice reminders
- [ ] Expanded drill library with video content
- [ ] Dark mode
