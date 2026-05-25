# Boges2Birds — Project Reference

## What This App Is
Golf performance training app. Users enroll in a Break 100/90/80 program, complete 4-week structured training blocks, log round stats, and receive AI-formatted weekly practice plans. Solo dev, AI-assisted, subscription SaaS. No GPS, no swing analysis, minimal input required.

---

## Git Workflow Rules
- **Write clear, descriptive commit messages.** Use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`. The subject line should say *why*, not just *what*.
- **Push after every meaningful session.** Never leave more than one session's worth of work unpushed. A robust git history is the rollback safety net — treat it that way.
- **One logical change per commit.** Don't bundle unrelated changes. A new screen, a bug fix, and a config tweak belong in separate commits.
- **Branch for features.** Main should always be stable. Use feature branches (`feat/onboarding-flow`, `fix/skill-engine-edge-case`) and merge via PR.
- **Pre-push review**: A Claude agent reviews all unpushed commits before every push. The push is blocked until you approve the review. After approval, re-run with `git push --no-verify` to bypass the review hook for that push.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Expo SDK 54 (managed workflow) |
| Router | Expo Router v6 |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| UI State | Zustand v5 |
| Server State | TanStack Query v5 |
| Local DB | expo-sqlite + Drizzle ORM |
| Cloud DB/Auth | Supabase (Postgres + Auth + RLS) |
| Subscriptions | RevenueCat SDK v8 |
| Animations | Reanimated v3 |
| Language | TypeScript v5 |

### Key install notes
- NativeWind v4 requires **Tailwind CSS v3** (not v4) — do not upgrade tailwindcss
- Install new packages with `npx expo install <pkg>` (not plain npm) so Expo resolves the correct SDK-compatible version
- If peer dep conflicts arise, use `--legacy-peer-deps`
- Node is at `/opt/homebrew/bin/node` — always `export PATH="/opt/homebrew/bin:$PATH"` in shell commands

---

## Design Tokens

```ts
// src/constants/colors.ts
background:  '#FFFFFF'
accent:      '#2E7D32'  // green CTA, highlights
text:        '#1A1A1A'  // primary headings
textMuted:   '#4A4A4A'  // body / taglines
textSubtle:  '#888888'  // small print, italic subtext
```

Visual tone: light, clean, white bg. Casual and motivating copy. No dark mode in v1.

---

## File Structure

```
boges2birds/
├── app/
│   ├── _layout.tsx                   ← Root Stack (imports global.css)
│   ├── index.tsx                     ← Welcome Screen
│   ├── (auth)/
│   │   ├── sign-in.tsx               ← Email + password login
│   │   └── sign-up.tsx               ← Registration + guest migration
│   ├── (onboarding)/
│   │   ├── program-select.tsx        ← Choose Break 100/90/80
│   │   ├── baseline-assessment.tsx   ← Skill ratings + session config
│   │   ├── create-account.tsx        ← Post-onboarding account creation
│   │   └── generating.tsx            ← Block generation loading
│   ├── practice/
│   │   └── [sessionId].tsx           ← Drill checklist + session completion
│   └── (tabs)/
│       ├── _layout.tsx               ← Tab bar layout
│       ├── index.tsx                 ← Home (session cards: "Day 1 — Driving Range")
│       ├── log-round.tsx             ← Round logging form
│       ├── library.tsx               ← Drill library with filters
│       └── profile.tsx               ← Profile + session config + subscription
├── src/
│   ├── engine/
│   │   ├── thresholds.ts             ← Threshold constants, program multipliers
│   │   ├── skillPriorityEngine.ts    ← Core skill ranking logic
│   │   ├── skillGrouping.ts          ← Session skill groupings (focused/auto/mixed) + labels
│   │   ├── blockGenerator.ts         ← 4-week block generation + time distribution
│   │   ├── drillSelector.ts          ← Maps sessions to drills
│   │   └── drillSeeds.ts             ← 25 built-in drills (all skills, all programs)
│   ├── db/
│   │   ├── schema.ts                 ← Drizzle schema (single source of truth)
│   │   ├── client.ts                 ← expo-sqlite connection
│   │   └── migrations/
│   ├── repositories/                 ← CRUD layer per table
│   ├── services/
│   │   ├── sync.ts                   ← SQLite → Supabase background sync
│   │   ├── auth.ts                   ← Supabase Auth wrapper
│   │   └── subscriptions.ts          ← RevenueCat wrapper
│   ├── store/
│   │   ├── sessionStore.ts           ← Ephemeral UI state (Zustand)
│   │   ├── userStore.ts
│   │   └── onboardingStore.ts
│   ├── hooks/
│   │   ├── useActiveTrainingBlock.ts  ← TanStack Query hook for active block
│   │   ├── useSessionDetails.ts      ← Session query + mutations (toggle drill, complete)
│   │   ├── useDrills.ts              ← All drills query (staleTime: Infinity)
│   │   ├── useProfile.ts             ← User, assessment, program queries + mutations
│   │   ├── useRoundLogs.ts
│   │   ├── useEntitlement.ts         ← Single subscription gate — all paywall logic here
│   │   └── usePaywall.ts             ← Paywall presentation hook
│   ├── components/
│   │   ├── ui/                       ← Reusable primitives (Button, Card, etc.)
│   │   ├── ErrorBoundary.tsx         ← Sentry-reporting error boundary
│   │   └── PaywallModal.tsx          ← RevenueCat paywall
│   ├── constants/
│   │   ├── colors.ts                 ← Color tokens
│   │   └── programs.ts               ← Program slugs and config
│   └── types/
│       └── index.ts                  ← Shared TypeScript types
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── global.css
└── CLAUDE.md
```

---

## Architecture Layers

```
PRESENTATION     Expo Router v6 + NativeWind v4
STATE            Zustand v5 (UI) | TanStack Query v5 (DB-sourced data)
BUSINESS LOGIC   src/engine/ — pure TypeScript, zero React imports
DATA ACCESS      Drizzle ORM + expo-sqlite | Supabase client
PERSISTENCE      SQLite (local-first) ←→ Supabase Postgres (sync)
EXTERNAL         RevenueCat | Supabase Auth
```

**Hard rules:**
- `src/engine/` must never import React or Zustand
- Zustand = ephemeral UI state only. TanStack Query = all DB-sourced data. Never duplicate.
- All subscription gates go through `useEntitlement()` only — never `if (isPremium)` scattered in components

---

## Database Schema (Drizzle / Supabase)

All tables have `id UUID PK`, `created_at`, `updated_at`. All user-owned tables have `user_id UUID FK`.

| Table | Key Columns |
|---|---|
| `users` | email, display_name, subscription_status, subscription_expires_at, revenuecat_customer_id |
| `skill_assessments` | user_id, avg_score, handicap_index, tee_shot_rating, iron_rating, short_game_rating, putting_rating, course_mgmt_rating, weekly_time_available (deprecated), sessions_per_week, session_duration, session_structure |
| `programs` | slug ('break100'\|'break90'\|'break80'), display_name, target_avg_score |
| `user_programs` | user_id, program_id, status ('active'\|'completed'\|'paused'), enrolled_at |
| `training_blocks` | user_id, block_number, week_start/end_date, skill_priorities (JSON), session_config (JSON), status |
| `sessions` | training_block_id, week_number, session_type, primary_skill, skills (JSON SkillArea[]), scheduled_date, duration_minutes, status |
| `drills` | name, skill_area, session_type, difficulty, duration_minutes, program_slug, instructions, is_system |
| `session_drills` | session_id, drill_id, order_index, completed |
| `round_logs` | user_id, played_at, course_name, holes_played, total_score, fairways_hit, fairways_total, gir_hit, gir_total, total_putts, penalties |
| `sync_log` | table_name, record_id, operation, synced, synced_at, error_message |

---

## Skill Priority Engine (`src/engine/skillPriorityEngine.ts`)

### Stat → Skill mapping
- `fairways_hit / fairways_total` → **driving**
- `gir_hit / gir_total` → **irons**
- `total_putts / holes_played` → **putting**
- `penalties` per round → **course_management**
- **short_game** = inferred (poor GIR + decent putting)

### Threshold scores (defined in `thresholds.ts`)
| Stat | Score 4 (critical) | Score 3 | Score 2 | Score 1 (solid) |
|---|---|---|---|---|
| Fairways % | < 30% | 30–44% | 45–60% | > 60% |
| GIR % | < 15% | 15–29% | 30–44% | > 44% |
| Putts/hole | > 2.2 | 2.0–2.2 | 1.8–2.0 | < 1.8 |
| Penalties | > 4 | 3–4 | 1–2 | 0 |

### Blending
- No rounds yet: 100% self-rating (1–5 scale → 1–4 engine score)
- With rounds: `blended = (stat_score × 0.70) + (self_rating × 0.30)` using last 3 rounds

### Program multipliers
| Skill | Break 100 | Break 90 | Break 80 |
|---|---|---|---|
| Putting | ×1.3 | ×1.0 | ×1.0 |
| Short Game | ×1.2 | ×1.1 | ×1.0 |
| Driving | ×1.1 | ×1.2 | ×1.1 |
| Irons | ×1.0 | ×1.3 | ×1.2 |
| Course Mgmt | ×0.9 | ×1.0 | ×1.4 |

---

## 4-Week Training Block (`src/engine/blockGenerator.ts`)

### Session configuration

Users configure their practice schedule during onboarding:
- **Sessions per week**: 1, 2, 3, or 4
- **Session duration**: 30, 45, 60, or 90 minutes (exact — no volume scaling)
- **Structure**: Auto, Focused, or Mixed

### Session structure modes (`src/engine/skillGrouping.ts`)

| Mode | Description |
|---|---|
| **Focused** | Skills grouped by venue — range skills (teeShot, irons) together, short game + putting together |
| **Mixed** | All 5 skills in every session, time split by priority |
| **Auto** | Same venue-based groupings as focused, but skills reordered within each group by priority score |

Focused/Auto groupings for each session count:
- 1 session: all 5 skills
- 2 sessions: [teeShot, irons, courseMgmt] + [shortGame, putting]
- 3 sessions: [teeShot, irons] + [shortGame, putting] + [courseMgmt]
- 4 sessions: [teeShot] + [irons] + [shortGame, putting] + [courseMgmt]

### Weekly themes
| Week | Theme |
|---|---|
| 1 | Foundation |
| 2 | Build |
| 3 | Peak |
| 4 | Consolidate |

---

## Subscription Architecture

- Tool: RevenueCat SDK v8
- Single entitlement: `'premium'`
- Single hook: `useEntitlement()` — every gate check uses this, nowhere else
- Free tier: onboarding + read-only Week 1 preview
- Paywall triggers: post-onboarding, session start, profile settings

---

## Offline-First Sync

- All reads from SQLite. All writes to SQLite first, then background push to Supabase.
- `sync_log` queues unsynced records; batch push on app foreground.
- Conflict resolution: higher `updated_at` wins.

---

## Implementation Status

All core features are implemented:

1. **Drizzle schema + SQLite migrations + Supabase setup + Auth** — complete
2. **Engine layer with unit tests** — complete (132 tests passing)
3. **Onboarding flow** — complete (program select → skill ratings + session config → block generation)
4. **Core screens** — complete (home, practice, log round, library, profile)
5. **RevenueCat + paywall** — complete (integration done, dashboard setup pending)
6. **Offline sync** — complete (SQLite → Supabase push pipeline)
7. **Per-session scheduling** — complete (1-4 sessions/week, configurable duration, focused/mixed/auto structure)

### Remaining for launch
- RevenueCat dashboard setup + real API key
- Sentry source map upload configuration
- Production EAS build + TestFlight + App Store submission

---

## Architectural Risks to Watch

| Risk | Mitigation |
|---|---|
| Schema drift (SQLite vs Supabase) | Single `schema.ts` source of truth; `supabase db push` in deploy workflow |
| Over-engineering the engine | `thresholds.ts` is a flat constants file only; add debug screen for raw scores |
| Subscription gate patchwork | One `useEntitlement()` hook — never scatter `if (isPremium)` |
| Zustand/TanStack Query duplication | Zustand = UI state only; TanStack Query = all DB data; never duplicate |
